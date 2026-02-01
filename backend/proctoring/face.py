import cv2
import mediapipe as mp

# --------------------------------------------------
# EXISTING FACE MESH (Behavior Analysis)
# --------------------------------------------------

mp_face = mp.solutions.face_mesh
face_mesh = mp_face.FaceMesh(
    static_image_mode=False,
    max_num_faces=2,
    refine_landmarks=True
)


def analyze_face(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)

    if not result.multi_face_landmarks:
        return {
            "faces": 0,
            "direction": "NONE",
            "event": "NO_FACE"
        }

    if len(result.multi_face_landmarks) > 1:
        return {
            "faces": len(result.multi_face_landmarks),
            "direction": "MULTIPLE",
            "event": "MULTIPLE_FACES"
        }

    landmarks = result.multi_face_landmarks[0].landmark

    nose_x = landmarks[1].x
    left = landmarks[234].x
    right = landmarks[454].x

    offset = nose_x - ((left + right) / 2)

    # UPDATED THRESHOLDS (your logic preserved)
    if offset > 0.06:
        return {"faces": 1, "direction": "LEFT", "event": "LOOKING_LEFT"}
    if offset < -0.06:
        return {"faces": 1, "direction": "RIGHT", "event": "LOOKING_RIGHT"}

    return {"faces": 1, "direction": "CENTER", "event": None}


# --------------------------------------------------
# NEW FACE EXTRACTION (Face Authentication)
# --------------------------------------------------

mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(
    model_selection=0,
    min_detection_confidence=0.6
)


def extract_face(frame):
    """
    Returns:
        face_img (BGR image or None)
        face_count (int)
        landmarks (list or None)
    """

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # -------- Face Detection (count + bbox)
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

    # -------- Face Mesh (landmarks)
    mesh_results = face_mesh.process(rgb)

    if not mesh_results.multi_face_landmarks:
        return face_img, 1, None

    landmarks = mesh_results.multi_face_landmarks[0].landmark

    return face_img, 1, landmarks

def is_face_clear(landmarks):
    try:
        upper_lip = landmarks[13]
        lower_lip = landmarks[14]
        chin = landmarks[152]

        lip_distance = abs(upper_lip.y - lower_lip.y)
        chin_distance = abs(chin.y - lower_lip.y)

        # tuned thresholds (work well in practice)
        if lip_distance < 0.008 or chin_distance < 0.03:
            return False

        return True
    except:
        return False
