#!/usr/bin/env python3
import cv2
import numpy as np

# 1) Kameraquelle anpassen (0=Webcam; sonst RTSP/HTTP)
STREAM_URL = "http://192.168.0.125/html/cam_pic_new.php"


# 2) Wir probieren mehrere gängige Dictionaries durch:
DICT_CANDIDATES = [
    cv2.aruco.DICT_4X4_50,
    cv2.aruco.DICT_4X4_100,
    cv2.aruco.DICT_4X4_250,
    cv2.aruco.DICT_4X4_1000,
    cv2.aruco.DICT_5X5_50,
    cv2.aruco.DICT_5X5_100,
    cv2.aruco.DICT_5X5_250,
    cv2.aruco.DICT_6X6_50,
    cv2.aruco.DICT_6X6_100,
    cv2.aruco.DICT_6X6_250,
    cv2.aruco.DICT_7X7_50,
    cv2.aruco.DICT_7X7_100,
    cv2.aruco.DICT_7X7_250,
]

def detect_once(frame):
    aruco = cv2.aruco
    for d in DICT_CANDIDATES:
        dictionary = aruco.getPredefinedDictionary(d)
        # neue vs. alte API
        if hasattr(aruco, "ArucoDetector"):
            params = aruco.DetectorParameters()
            detector = aruco.ArucoDetector(dictionary, params)
            corners, ids, _ = detector.detectMarkers(frame)
        else:
            params = aruco.DetectorParameters_create()
            corners, ids, _ = aruco.detectMarkers(frame, dictionary, parameters=params)

        if ids is not None and len(ids) > 0:
            name = [k for k,v in aruco.__dict__.items() if v == d and k.startswith("DICT_")]
            dict_name = name[0] if name else str(d)
            return dict_name, corners, ids
    return None, None, None

def main():
    cap = cv2.VideoCapture(STREAM_URL)
    if not cap.isOpened():
        print(f"Stream nicht geöffnet: {STREAM_URL}")
        return

    last_dict = None
    print("Zeige die Marker in die Kamera. Drücke 'q' zum Beenden.")
    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        dict_name, corners, ids = detect_once(frame)
        if ids is not None:
            if dict_name != last_dict:
                print(f"[INFO] Erkanntes ArUco-Dictionary: {dict_name}")
                last_dict = dict_name

            for i, cid in enumerate(ids.flatten()):
                c = corners[i][0]  # 4x2
                u = int(np.mean(c[:,0])); v = int(np.mean(c[:,1]))
                cv2.putText(frame, f"ID {int(cid)} ({dict_name})", (u, v),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.25, (0,255,255), 2)
                # Ecken einzeichnen
                for (x,y) in c.astype(int):
                    cv2.circle(frame, (x,y), 3, (0,255,0), -1)

            # IDs einmal in die Konsole ausgeben
            print("Gefundene IDs:", [int(x) for x in ids.flatten()])

        cv2.imshow("ArUco ID Probe", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
