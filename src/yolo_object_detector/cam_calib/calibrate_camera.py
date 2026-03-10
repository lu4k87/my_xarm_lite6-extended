import cv2
import numpy as np
import os
import glob
import yaml

# --- Konfiguration ---
# Passe diese Werte an dein Schachbrett an.
# Anzahl der inneren Ecken des Schachbretts (Spalten, Zeilen).
CHESSBOARD_DIM = (7, 7) 
# Größe eines Quadrats auf dem Schachbrett in Metern.
SQUARE_SIZE = 0.02  # 2.0 cm

# Verzeichnis, in dem die Kalibrierungsbilder gespeichert sind.
IMAGE_DIR = "/home/mk/dev_ws/src/yolo_object_detector/cam_calib_imgs"

# Ausgabedatei für die Kalibrierungsdaten.
# Der Pfad sollte zu deinem Paket passen, damit er später von ROS 2 gefunden wird.
OUTPUT_FILE = os.path.expanduser('~/dev_ws/src/yolo_object_detector/cam_calib/camera_calibration_data.yaml')

# --- Skript-Logik ---
def calibrate_camera():
    """
    Führt die Kamerakalibrierung anhand von Schachbrettbildern durch
    und speichert die Ergebnisse in einer YAML-Datei.
    """
    # 3D-Punkte im realen Raum vorbereiten (z.B. (0,0,0), (1,0,0), ..., (8,5,0))
    objp = np.zeros((CHESSBOARD_DIM[0] * CHESSBOARD_DIM[1], 3), np.float32)
    objp[:, :2] = np.mgrid[0:CHESSBOARD_DIM[0], 0:CHESSBOARD_DIM[1]].T.reshape(-1, 2)
    objp = objp * SQUARE_SIZE

    # Arrays zum Speichern der Objektpunkte und Bildpunkte aus allen Bildern.
    objpoints = []  # 3D-Punkte in der realen Welt
    imgpoints = []  # 2D-Punkte in der Bildebene

    images = glob.glob(os.path.join(IMAGE_DIR, '*.jpg'))
    if not images:
        images = glob.glob(os.path.join(IMAGE_DIR, '*.png'))

    if not images:
        print(f"Fehler: Keine Bilder im Verzeichnis '{IMAGE_DIR}' gefunden.")
        return

    print(f"{len(images)} Bilder zur Kalibrierung gefunden...")

    for fname in images:
        img = cv2.imread(fname)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Finde die Ecken des Schachbretts
        ret, corners = cv2.findChessboardCorners(gray, CHESSBOARD_DIM, None)

        # Wenn Ecken gefunden wurden, füge Objekt- und Bildpunkte hinzu
        if ret:
            objpoints.append(objp)
            # Verfeinere die Eckpunkte für höhere Genauigkeit
            corners2 = cv2.cornerSubPix(gray, corners, (11, 11), (-1, -1), 
                                       (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001))
            imgpoints.append(corners2)

            # Zeichne die Ecken zur visuellen Überprüfung
            cv2.drawChessboardCorners(img, CHESSBOARD_DIM, corners2, ret)
            cv2.imshow('Schachbrett-Erkennung', img)
            cv2.waitKey(500)  # Zeige das Bild für 0.5 Sekunden

    cv2.destroyAllWindows()
    
    if not imgpoints:
        print("Fehler: Konnte in keinem Bild ein Schachbrett finden. Überprüfe CHESSBOARD_DIM.")
        return

    print("Kalibrierung wird durchgeführt...")
    # Führe die eigentliche Kamerakalibrierung durch
    ret, mtx, dist, rvecs, tvecs = cv2.calibrateCamera(objpoints, imgpoints, gray.shape[::-1], None, None)

    if not ret:
        print("Kalibrierung fehlgeschlagen.")
        return

    print("\n--- Kalibrierung erfolgreich! ---")
    print("Kamera-Matrix (K):")
    print(mtx)
    print("\nVerzerrungskoeffizienten (dist):")
    print(dist)

    # Speichere die Daten in einer YAML-Datei
    calibration_data = {
        'image_width': gray.shape[1],
        'image_height': gray.shape[0],
        'camera_name': 'default_camera',
        'camera_matrix': {
            'rows': 3, 'cols': 3,
            'data': mtx.flatten().tolist()
        },
        'distortion_model': 'plumb_bob',
        'distortion_coefficients': {
            'rows': 1, 'cols': 5,
            'data': dist.flatten().tolist()
        }
    }

    with open(OUTPUT_FILE, 'w') as f:
        yaml.dump(calibration_data, f, default_flow_style=None, sort_keys=False)

    print(f"\nKalibrierungsdaten wurden erfolgreich in '{OUTPUT_FILE}' gespeichert.")

if __name__ == '__main__':
    calibrate_camera()
