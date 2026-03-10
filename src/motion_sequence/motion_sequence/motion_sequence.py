#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import math
import time

import rclpy
from rclpy.node import Node
from rclpy.duration import Duration
from rclpy.task import Future

from std_srvs.srv import Trigger
from controller_manager_msgs.srv import SwitchController
from xarm_msgs.srv import SetInt16, MoveCartesian, GetFloat32List


class MotionSequenceNode(Node):
    """
    Führt robuste Bewegungssequenzen aus (asynchron) und bietet:
      - Safe-Pose-Service: execute_motion_sequence_scan_object_positions_pos (Trigger)
      - Generischer Move-Service: execute_motion_to_pose (MoveCartesian)
      - Busy-Status: get_motion_busy (Trigger.success=True => IDLE)
    Ablauf bei Sequenzen:
      Stop Servo -> Controller deaktivieren -> POSE-Modus -> State 0 ->
      (optional) Vorbewegung auf sichere Z-Höhe -> Bewegung -> Warten bis erreicht ->
      zurück in SERVO-Modus -> State 0 -> Controller reaktivieren (mit Retry) -> Servo starten
    """

    def __init__(self):
        super().__init__('switcher_node')
        self.get_logger().info('Motion Sequence Node has been started.')

        # ---- Service-Clients ----
        self.stop_servo_cli        = self.create_client(Trigger,           '/servo_server/stop_servo')
        self.start_servo_cli       = self.create_client(Trigger,           '/servo_server/start_servo')
        self.switch_controller_cli = self.create_client(SwitchController,  '/controller_manager/switch_controller')
        self.set_mode_cli          = self.create_client(SetInt16,          '/ufactory/set_mode')
        self.set_state_cli         = self.create_client(SetInt16,          '/ufactory/set_state')
        self.set_position_cli      = self.create_client(MoveCartesian,     '/ufactory/set_position')
        self.get_position_cli      = self.create_client(GetFloat32List,    '/ufactory/get_position')

        # ---- Sequenz-/Monitoring-Zustand ----
        self.sequence_state = None
        self.sequence_response = None
        self.movement_monitor_timer = None
        self.movement_monitor_future = None
        self.movement_target_xyz = None
        self.movement_position_tolerance = None
        self.movement_start_time = None
        self.movement_max_wait_time = None

        # ---- Services dieses Knotens ----
        self.srv_safe = self.create_service(
            Trigger,
            'execute_motion_sequence_scan_object_positions_pos',
            self.execute_sequence_callback_scan_pose
        )
        self.srv_execute_pose = self.create_service(
            MoveCartesian,
            'execute_motion_to_pose',
            self.execute_motion_to_pose_cb
        )
        self.srv_busy = self.create_service(
            Trigger,
            'get_motion_busy',
            self.get_motion_busy_cb
        )

        # Optional: Beispiele Y/X/B
        self.trigger_service_y = self.create_service(Trigger, 'execute_motion_sequence_Y', self.execute_sequence_callback_y_button)
        
        self.get_logger().info('Ready to receive triggers to execute motion sequences for Y and scan_object_positions_pos.')

    # -------------------------------------------------------------------------
    # Öffentliche Hilfsservices
    # -------------------------------------------------------------------------
    def get_motion_busy_cb(self, request, response):
        busy = (self.sequence_state is not None)
        response.success = not busy
        response.message = 'IDLE' if not busy else 'BUSY'
        return response

    # -------------------------------------------------------------------------
    # Bring-up
    # -------------------------------------------------------------------------
    def wait_for_services_startup(self):
        self.get_logger().info('Waiting for services...')
        services = [
            self.stop_servo_cli, self.start_servo_cli, self.switch_controller_cli,
            self.set_mode_cli, self.set_state_cli, self.set_position_cli,
            self.get_position_cli
        ]
        for client in services:
            name = client.srv_name
            self.get_logger().info(f'Waiting for {name}...')
            if not client.wait_for_service(timeout_sec=60.0):
                self.get_logger().error(f'Service {name} not available after 60 seconds.')
        self.get_logger().info('All critical services are available.')

    async def call_service_async_robust(self, client, request, timeout_sec: float = 20.0):
        """ Generischer, robuster Service-Call mit grundlegender Erfolgsauswertung. """
        if not client.service_is_ready():
            self.get_logger().error(f'Service {client.srv_name} is not available. Skipping call.')
            return None
        fut = client.call_async(request)
        try:
            resp = await fut
            if resp is None:
                self.get_logger().error(f'Service {client.srv_name} returned None.')
                return None
            if hasattr(resp, 'success') and not resp.success:
                self.get_logger().error(f'{client.srv_name} failed: {getattr(resp, "message", "")}')
                return None
            if hasattr(resp, 'ok') and not resp.ok:
                self.get_logger().error(f'{client.srv_name} failed (ok=false).')
                return None
            if hasattr(resp, 'ret') and resp.ret != 0:
                self.get_logger().error(f'{client.srv_name} ret={resp.ret} msg={getattr(resp, "message", "")}')
                return None
            self.get_logger().info(f'Service {client.srv_name} call successful.')
            return resp
        except Exception as e:
            self.get_logger().error(f'Service {client.srv_name} call failed: {e}')
            return None

    # -------------------------------------------------------------------------
    # Service-Callbacks (Eingänge)
    # -------------------------------------------------------------------------
    def execute_sequence_callback_y_button(self, request, response):
        self.get_logger().info('Y-Button sequence triggered.')
        return self._start_sequence_async([260.0, 0.0, 520.0, 3.14, 0.0, 0.0], response)
   
    def execute_sequence_callback_scan_pose(self, request, response):
        self.get_logger().info('Safe-Pose scan_object_positions_pos triggered.')
        return self._start_sequence_async([260.0, 0.0, 520.0, 3.14, 0.0, 0.0], response)

    def execute_motion_to_pose_cb(self, request: MoveCartesian.Request, response: MoveCartesian.Response):
        self.get_logger().info(f'execute_motion_to_pose requested: {request.pose}')
        return self._start_sequence_async(list(request.pose), response)

    # -------------------------------------------------------------------------
    # Sequenz-Start & Response-Handling
    # -------------------------------------------------------------------------
    def _set_response_busy(self, response):
        msg = 'Sequence already running.'
        if hasattr(response, 'success'):
            response.success = False
            if hasattr(response, 'message'):
                response.message = msg
        elif hasattr(response, 'ret'):
            response.ret = -1
            if hasattr(response, 'message'):
                response.message = msg
        return response

    def _set_response_started(self, response):
        if hasattr(response, 'success'):
            response.success = True
            if hasattr(response, 'message'):
                response.message = 'Motion sequence initiated asynchronously.'
        elif hasattr(response, 'ret'):
            response.ret = 0
            if hasattr(response, 'message'):
                response.message = 'Motion sequence initiated asynchronously.'
        return response

    def _start_sequence_async(self, target_pose, response):
        """ Startet die asynchrone Sequenz, wenn keiner läuft. """
        if self.sequence_state is not None:
            self.get_logger().warn('Motion sequence already in progress. Ignoring new trigger.')
            return self._set_response_busy(response)

        self.get_logger().info('Executing motion sequence...')
        self.sequence_response = response
        self.sequence_state = 0

        try:
            # Executor-Task erzeugen (Executor wird in main() gesetzt)
            self.executor.create_task(self._run_sequence(target_pose))
        except Exception as e:
            self.get_logger().error(f'Failed to create sequence task: {e}')
            if hasattr(response, 'success'):
                response.success = False
                if hasattr(response, 'message'):
                    response.message = f'Internal error creating sequence task: {e}'
            elif hasattr(response, 'ret'):
                response.ret = -1
                if hasattr(response, 'message'):
                    response.message = f'Internal error creating sequence task: {e}'
            self.sequence_state = None
            return response

        return self._set_response_started(response)

    # -------------------------------------------------------------------------
    # Hilfs: Async-Sleep via ROS-Timer (ohne asyncio)
    # -------------------------------------------------------------------------
    async def _sleep_via_timer(self, seconds: float):
        """Nicht-blockierendes Warten via rclpy-Timer (keine asyncio-Loop nötig)."""
        fut = Future()
        # kleine Schutz-Funktion, damit wir Timer zuverlässig canceln
        def _done_cb():
            if not fut.done():
                fut.set_result(True)
            if timer:
                try:
                    timer.cancel()
                except Exception:
                    pass
        timer = self.create_timer(seconds, _done_cb)
        await fut

    # -------------------------------------------------------------------------
    # Hauptsequenz
    # -------------------------------------------------------------------------
    async def _run_sequence(self, target_pose):
        success = True
        error_message = ""

        try:
            # 1) Servo stoppen
            self.get_logger().info('1/9: Stopping servo...')
            res = await self.call_service_async_robust(self.stop_servo_cli, Trigger.Request())
            if res is None or (hasattr(res, 'success') and not res.success):
                success = False; error_message = "Failed to stop servo."; return

            # 2) Controller deaktivieren
            self.get_logger().info('2/9: Deactivating controller...')
            req_deact = SwitchController.Request(
                deactivate_controllers=['lite6_traj_controller'],
                activate_controllers=[],
                strictness=2
            )
            res = await self.call_service_async_robust(self.switch_controller_cli, req_deact, timeout_sec=30.0)
            if res is None or (hasattr(res, 'ok') and not res.ok):
                success = False; error_message = "Failed to deactivate controller."; return

            # 3) In POSE-Modus
            self.get_logger().info('3/9: Switching to POSE mode (data: 0)...')
            res = await self.call_service_async_robust(self.set_mode_cli, SetInt16.Request(data=0))
            if res is None or (hasattr(res, 'ret') and res.ret != 0):
                success = False; error_message = "Failed to switch to POSE mode."; return

            # 4) State setzen
            self.get_logger().info('4/9: Setting state (data: 0) after mode change...')
            res = await self.call_service_async_robust(self.set_state_cli, SetInt16.Request(data=0))
            if res is None or (hasattr(res, 'ret') and res.ret != 0):
                success = False; error_message = "Failed to set state to 0."; return

            # 5) ggf. sichere Z-Höhe
            self.get_logger().info('5/9: Checking current Z-height for pre-movement to safe Z (150mm)...')
            safe_z_reached = await self.pre_move_to_safe_z_async(
                safe_z_height=150.0, check_threshold=95.0,
                max_wait_time_sec=30.0, position_tolerance=5.0
            )
            if not safe_z_reached:
                success = False; error_message = "Failed to move to safe Z-height or timeout."; return

            # 6) Bewegung zur Zielpose
            self.get_logger().info(f'6/9: Executing movement to pose {target_pose}...')
            req_move = MoveCartesian.Request(pose=target_pose, speed=200.0, acc=500.0, mvtime=0.0)
            res = await self.call_service_async_robust(self.set_position_cli, req_move)
            if res is None or (hasattr(res, 'ret') and res.ret != 0):
                success = False; error_message = "Failed to send movement command."; return

            self.get_logger().info('Movement command sent. Waiting for completion...')
            reached = await self._wait_for_movement_completion_with_timer(
                target_pose[:3], max_wait_time_sec=60.0, position_tolerance=5.0
            )
            if not reached:
                success = False; error_message = "Movement did not complete within timeout."; return

            # 7) Zurück in SERVO-Modus
            self.get_logger().info('7/9: Switching back to SERVO mode (data: 1)...')
            res = await self.call_service_async_robust(self.set_mode_cli, SetInt16.Request(data=1))
            if res is None or (hasattr(res, 'ret') and res.ret != 0):
                success = False; error_message = "Failed to switch to SERVO mode."; return

            # 8) State setzen
            self.get_logger().info('8/9: Setting state (data: 0) after servo mode change...')
            res = await self.call_service_async_robust(self.set_state_cli, SetInt16.Request(data=0))
            if res is None or (hasattr(res, 'ret') and res.ret != 0):
                success = False; error_message = "Failed to set state to 0 again."; return

            # 9) Controller reaktivieren (mit Retry – **ohne asyncio.sleep**)
            self.get_logger().info('9/9: Re-activating controller...')
            req_act = SwitchController.Request(
                deactivate_controllers=[],
                activate_controllers=['lite6_traj_controller'],
                strictness=2
            )

            ok = False
            # kleiner Initial-Delay, manche Controller brauchen einen Tick Ruhe
            await self._sleep_via_timer(0.3)

            for attempt in range(3):
                res = await self.call_service_async_robust(self.switch_controller_cli, req_act, timeout_sec=30.0)
                if res is not None and (not hasattr(res, 'ok') or res.ok):
                    ok = True
                    break
                self.get_logger().warn(f'Activate controller attempt {attempt+1} failed. Waiting 0.5s and retrying …')
                await self._sleep_via_timer(0.5)

            if not ok:
                success = False; error_message = "Failed to re-activate controller after retries."; return

            # Servo neu starten
            self.get_logger().info('Sequence complete. Restarting servo...')
            res = await self.call_service_async_robust(self.start_servo_cli, Trigger.Request())
            if res is None or (hasattr(res, 'success') and not res.success):
                success = False; error_message = "Failed to restart servo."; return

            self.get_logger().info('Motion sequence finished successfully!')

        except Exception as e:
            success = False
            error_message = f"An unexpected error occurred during sequence: {e}"
            self.get_logger().error(error_message)

        finally:
            # Response korrekt je Typ füllen
            if self.sequence_response:
                if hasattr(self.sequence_response, 'success'):
                    self.sequence_response.success = success
                    if hasattr(self.sequence_response, 'message'):
                        self.sequence_response.message = error_message if not success else 'Motion sequence executed.'
                elif hasattr(self.sequence_response, 'ret'):
                    self.sequence_response.ret = 0 if success else -1
                    if hasattr(self.sequence_response, 'message'):
                        self.sequence_response.message = error_message if not success else 'Motion sequence executed.'
            else:
                self.get_logger().warn('Sequence response object was None, cannot set result.')

            # Status & Timer aufräumen
            self.sequence_state = None
            if self.movement_monitor_timer:
                self.movement_monitor_timer.cancel()
                self.movement_monitor_timer = None
            self.movement_monitor_future = None

    # -------------------------------------------------------------------------
    # Hilfsfunktionen
    # -------------------------------------------------------------------------
    async def pre_move_to_safe_z_async(self, safe_z_height, check_threshold, max_wait_time_sec, position_tolerance):
        """Bewegt bei Bedarf auf sichere Z-Höhe, X/Y bleiben gleich."""
        self.get_logger().info(f'Attempting to move to safe Z-height: {safe_z_height} mm (if current Z < {check_threshold}mm)')
        pos_response = await self.call_service_async_robust(self.get_position_cli, GetFloat32List.Request(), timeout_sec=5.0)
        if pos_response is None or pos_response.ret != 0 or not pos_response.datas:
            self.get_logger().error('Could not get current position to determine safe Z-move target.')
            return False

        current_x, current_y, current_z, current_r, current_p, current_yaw = pos_response.datas[:6]
        if current_z >= check_threshold:
            self.get_logger().info(f'Current Z-position ({current_z:.2f}mm) >= threshold ({check_threshold}mm) -> skipping pre-move.')
            return True

        target_safe_z_pose = [current_x, current_y, safe_z_height, current_r, current_p, current_yaw]
        self.get_logger().info(f'Calculated safe Z-target pose: {target_safe_z_pose}')

        req_move = MoveCartesian.Request(pose=target_safe_z_pose, speed=100.0, acc=500.0, mvtime=0.0)
        res = await self.call_service_async_robust(self.set_position_cli, req_move)
        if res is None or (hasattr(res, 'ret') and res.ret != 0):
            self.get_logger().error('Failed to send move command to safe Z-height.')
            return False

        self.get_logger().info('Movement to safe Z command sent. Waiting for completion...')
        reached = await self._wait_for_movement_completion_with_timer(target_safe_z_pose[:3], max_wait_time_sec, position_tolerance)
        if not reached:
            self.get_logger().error('Movement to safe Z-height did not complete within timeout.')
            return False

        self.get_logger().info('Successfully reached safe Z-height.')
        return True

    async def _wait_for_movement_completion_with_timer(self, target_xyz, max_wait_time_sec, position_tolerance):
        """Pollt periodisch die aktuelle Position, bis Ziel in Toleranz ist oder Timeout."""
        self.get_logger().info(f'Starting movement completion monitor (max {max_wait_time_sec}s, tol {position_tolerance}mm)...')

        self.movement_target_xyz = target_xyz
        self.movement_position_tolerance = position_tolerance
        self.movement_start_time = self.get_clock().now()
        self.movement_max_wait_time = Duration(seconds=max_wait_time_sec)

        self.movement_monitor_future = Future()
        self.movement_monitor_timer = self.create_timer(0.1, self._movement_monitor_callback)

        try:
            await self.movement_monitor_future
            return self.movement_monitor_future.result()
        except Exception:
            return False
        finally:
            if self.movement_monitor_timer:
                self.movement_monitor_timer.cancel()
                self.movement_monitor_timer = None

    def _movement_monitor_callback(self):
        if self.movement_monitor_future.done():
            if self.movement_monitor_timer:
                self.movement_monitor_timer.cancel()
            return

        # Timeout?
        if (self.get_clock().now() - self.movement_start_time) > self.movement_max_wait_time:
            self.get_logger().warn('Timeout reached! Robot did not reach the target position in time.')
            if not self.movement_monitor_future.done():
                self.movement_monitor_future.set_result(False)
            if self.movement_monitor_timer:
                self.movement_monitor_timer.cancel()
            return

        # aktuelle Position anfordern und prüfen
        self.executor.create_task(self._get_position_and_check())

    async def _get_position_and_check(self):
        if self.movement_monitor_future.done():
            return

        pos_response = await self.call_service_async_robust(self.get_position_cli, GetFloat32List.Request(), timeout_sec=1.0)
        if self.movement_monitor_future.done():
            return

        if pos_response is not None and pos_response.ret == 0 and pos_response.datas:
            current_xyz = pos_response.datas[:3]
            distance = math.sqrt(
                (current_xyz[0] - self.movement_target_xyz[0])**2 +
                (current_xyz[1] - self.movement_target_xyz[1])**2 +
                (current_xyz[2] - self.movement_target_xyz[2])**2
            )
            if distance <= self.movement_position_tolerance:
                self.get_logger().info('Robot has reached the target position.')
                if not self.movement_monitor_future.done():
                    self.movement_monitor_future.set_result(True)
        else:
            ret_val = pos_response.ret if pos_response else "N/A"
            self.get_logger().warn(f'Invalid position data (ret: {ret_val}).')


def main(args=None):
    rclpy.init(args=args)
    executor = rclpy.executors.MultiThreadedExecutor()
    node = MotionSequenceNode()
    node.executor = executor  # wichtig für create_task()
    executor.add_node(node)

    node.wait_for_services_startup()

    try:
        executor.spin()
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()

