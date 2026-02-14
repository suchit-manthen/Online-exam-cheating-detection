import cv2
import mediapipe as mp
import numpy as np

# --------------------------------------------------
# MediaPipe Setup (Shared)
# --------------------------------------------------

mp_face = mp.solutions.face_mesh
face_mesh = mp_face.FaceMesh(
    static_image_mode=False,
    max_num_faces=2,
    refine_landmarks=True
)

mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(
    model_selection=0,
    min_detection_confidence=0.6
)

# --------------------------------------------------
# HEAD MOVEMENT ANALYSIS
# --------------------------------------------------

def analyze_head_direction(landmarks):
    nose_x = landmarks[1].x
    left = landmarks[234].x
    right = landmarks[454].x

    offset = nose_x - ((left + right) / 2)

    if offset > 0.06:
        return "LEFT", "LOOKING_LEFT"
    if offset < -0.06:
        return "RIGHT", "LOOKING_RIGHT"

    return "CENTER", None


# --------------------------------------------------
# EYE GAZE ANALYSIS
# --------------------------------------------------

def analyze_eye_gaze(landmarks):
    # Left eye
    left_corner = landmarks[33]
    right_corner = landmarks[133]
    iris = landmarks[468]  # left iris center

    eye_width = right_corner.x - left_corner.x
    if eye_width == 0:
        return "CENTER", None

    iris_position = (iris.x - left_corner.x) / eye_width

    if iris_position < 0.35:
        return "LEFT", "GAZE_LEFT"
    elif iris_position > 0.65:
        return "RIGHT", "GAZE_RIGHT"

    return "CENTER", None


# --------------------------------------------------
# FULL FACE ANALYSIS (HEAD + GAZE)
# --------------------------------------------------

def analyze_face(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)

    if not result.multi_face_landmarks:
        return {
            "faces": 0,
            "direction": "NONE",
            "event": "NO_FACE",
            "gaze": "NONE"
        }

    if len(result.multi_face_landmarks) > 1:
        return {
            "faces": len(result.multi_face_landmarks),
            "direction": "MULTIPLE",
            "event": "MULTIPLE_FACES",
            "gaze": "NONE"
        }

    landmarks = result.multi_face_landmarks[0].landmark

    # ---- HEAD ----
    head_direction, head_event = analyze_head_direction(landmarks)

    # ---- GAZE ----
    gaze_direction, gaze_event = analyze_eye_gaze(landmarks)

    # Priority: head movement > gaze movement
    event = head_event if head_event else gaze_event

    return {
        "faces": 1,
        "direction": head_direction,
        "gaze": gaze_direction,
        "event": event
    }


# --------------------------------------------------
# FACE EXTRACTION (Authentication)
# --------------------------------------------------

def extract_face(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    detection_results = face_detection.process(rgb)

    if not detection_results.detections:
        return None, 0, None

    if len(detection_results.detections) > 1:
        return None, len(detection_results.detections), None

    h, w, _ = frame.shape
    bbox = detection_results.detections[0].location_data.relative_bounding_box

    x1 = int(bbox.xmin * w)
    y1 = int(bbox.ymin * h)
    x2 = int((bbox.xmin + bbox.width) * w)
    y2 = int((bbox.ymin + bbox.height) * h)

    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)

    face_img = frame[y1:y2, x1:x2]

    if face_img.size == 0:
        return None, 0, None

    mesh_results = face_mesh.process(rgb)
    landmarks = mesh_results.multi_face_landmarks[0].landmark if mesh_results.multi_face_landmarks else None

    return face_img, 1, landmarks
