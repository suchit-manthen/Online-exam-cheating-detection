from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import base64
import time
from collections import defaultdict

from proctoring.face import analyze_face
from proctoring.phone import detect_phone
from proctoring.face_auth import get_face_embedding as extract_embedding, cosine_distance
from db.events import log_event
from db.attempts import evaluate_attempt, get_face_embedding

proctoring_bp = Blueprint("proctoring", __name__)

# -----------------------------------
# TOLERANCE & COOLDOWNS
# -----------------------------------
NO_FACE_THRESHOLD = 3          # frames
NO_FACE_TIME_WINDOW = 8        # seconds
EVENT_COOLDOWN = 2             # seconds

FACE_MISMATCH_THRESHOLD = 0.35
FACE_MISMATCH_CONSECUTIVE = 3

last_face_seen = {}
no_face_counter = {}
last_event_time = {}
face_mismatch_counter = defaultdict(int)

# -----------------------------------
# ANALYZE FRAME
# -----------------------------------
@proctoring_bp.route("/analyze-frame", methods=["POST"])
def analyze_frame():
    data = request.json
    attempt_id = int(data["attempt_id"])
    image = data["image"]

    # Decode frame
    image_bytes = base64.b64decode(image.split(",")[1])
    np_arr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    now = time.time()

    # Init tracking
    last_face_seen.setdefault(attempt_id, now)
    no_face_counter.setdefault(attempt_id, 0)
    last_event_time.setdefault(attempt_id, 0)
    face_mismatch_counter.setdefault(attempt_id, 0)

    response = {
        "faces_detected": 0,
        "direction": "CENTER",
        "phone_detected": False,
        "status": None,
        "warning": None
    }

    # -----------------------------------
    # PHONE DETECTION
    # -----------------------------------
    phone_detected = detect_phone(frame)
    response["phone_detected"] = phone_detected

    # -----------------------------------
    # FACE ANALYSIS
    # -----------------------------------
    face_result = analyze_face(frame)

    response["faces_detected"] = face_result["faces"]
    response["direction"] = face_result["direction"]

    event = face_result["event"]

    # -----------------------------------
    # NO FACE TOLERANCE
    # -----------------------------------
    if event == "NO_FACE":
        no_face_counter[attempt_id] += 1

        if (
            no_face_counter[attempt_id] >= NO_FACE_THRESHOLD
            and now - last_face_seen[attempt_id] > NO_FACE_TIME_WINDOW
        ):
            log_event("NO_FACE", attempt_id)
            last_event_time[attempt_id] = now
            no_face_counter[attempt_id] = 0

        response.update(evaluate_attempt(attempt_id))
        return jsonify(response)

    # Face detected → reset counters
    last_face_seen[attempt_id] = now
    no_face_counter[attempt_id] = 0

    # -----------------------------------
    # FACE MISMATCH DETECTION (PHASE 4)
    # -----------------------------------
    stored_embedding = get_face_embedding(attempt_id)

    if stored_embedding is not None and face_result["faces"] == 1:
        current_embedding = extract_embedding(frame)

        if current_embedding is not None:
            distance = cosine_distance(stored_embedding, current_embedding)

            if distance > FACE_MISMATCH_THRESHOLD:
                face_mismatch_counter[attempt_id] += 1

                if face_mismatch_counter[attempt_id] >= FACE_MISMATCH_CONSECUTIVE:
                    log_event("FACE_MISMATCH", attempt_id)
                    face_mismatch_counter[attempt_id] = 0
            else:
                face_mismatch_counter[attempt_id] = 0

    # -----------------------------------
    # OTHER EVENTS (WITH COOLDOWN)
    # -----------------------------------
    if event and now - last_event_time[attempt_id] > EVENT_COOLDOWN:
        log_event(event, attempt_id)
        last_event_time[attempt_id] = now

    response.update(evaluate_attempt(attempt_id))
    return jsonify(response)
