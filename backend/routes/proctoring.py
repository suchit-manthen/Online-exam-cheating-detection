from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import base64
import time
from collections import defaultdict
from threading import Lock  # <--- NEW IMPORT

from proctoring.face import analyze_face, extract_face
from proctoring.phone import detect_phone
from proctoring.face_auth import (
    get_face_embedding as extract_embedding,
    cosine_distance
)

from db.events import log_event
from db.attempts import (
    evaluate_attempt,
    get_face_embedding,
    terminate_attempt
)

proctoring_bp = Blueprint("proctoring", __name__)

# =================================================
# CONFIGURATION
# =================================================

NO_FACE_THRESHOLD = 3
NO_FACE_TIME_WINDOW = 8
EVENT_COOLDOWN = 2

PHONE_DURATION_THRESHOLD = 3      
PHONE_COOLDOWN = 8                

HEAD_DURATION_THRESHOLD = 2       
HEAD_COOLDOWN = 5

GAZE_DURATION_THRESHOLD = 2
GAZE_COOLDOWN = 5

FACE_MISMATCH_THRESHOLD = 0.35
FACE_MISMATCH_CONSECUTIVE = 3

# =================================================
# IN-MEMORY STATE
# =================================================

# Lock to prevent race conditions between frames
thread_lock = Lock()  # <--- NEW LOCK OBJECT

last_face_seen = {}
no_face_counter = {}

phone_start_time = {}
last_phone_logged = {}

head_start_time = {}
last_head_logged = {}

gaze_start_time = {}
last_gaze_logged = {}

face_mismatch_counter = defaultdict(int)
identity_warning_issued = set()

# =================================================
# ANALYZE FRAME
# =================================================

@proctoring_bp.route("/analyze-frame", methods=["POST"])
def analyze_frame():
    data = request.json

    if not data or "attempt_id" not in data or "image" not in data:
        return jsonify({"error": "Invalid payload"}), 400

    attempt_id = int(data["attempt_id"])
    image = data["image"]

    # --- 1. DECODE IMAGE (Heavy work, keep outside lock) ---
    try:
        image_bytes = base64.b64decode(image.split(",")[1])
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except:
        return jsonify({"error": "Image decode failed"}), 400

    now = time.time()

    # --- 2. RUN AI MODELS (Heavy work, keep outside lock) ---
    # Running these outside the lock keeps your server fast.
    phone_detected = detect_phone(frame)
    face_result = analyze_face(frame)
    
    # Extract identity data if needed
    live_embedding = None
    stored_embedding = get_face_embedding(attempt_id)
    if stored_embedding and face_result["faces"] == 1:
        face_img, face_count, _ = extract_face(frame)
        if face_count == 1 and face_img is not None:
             try:
                 live_embedding = extract_embedding(face_img)
             except:
                 pass

    response = {
        "faces_detected": face_result["faces"],
        "direction": face_result["direction"],
        "gaze": face_result.get("gaze", "CENTER"),
        "phone_detected": phone_detected,
        "status": None,
        "warning": None
    }

    # --- 3. UPDATE STATE & LOGGING (CRITICAL SECTION - LOCKED) ---
    # We lock this part so multiple frames can't update timers at the same time.
    with thread_lock:
        
        # Initialize defaults safely
        last_face_seen.setdefault(attempt_id, now)
        no_face_counter.setdefault(attempt_id, 0)

        # ---------------- PHONE LOGIC ----------------
        if phone_detected:
            state = phone_start_time.get(attempt_id)
            if not state:
                phone_start_time[attempt_id] = {"start": now}
            else:
                duration = now - state["start"]
                last_logged = last_phone_logged.get(attempt_id, 0)

                if duration >= PHONE_DURATION_THRESHOLD:
                    if (now - last_logged > PHONE_COOLDOWN):
                        log_event("PHONE_DETECTED", attempt_id)
                        last_phone_logged[attempt_id] = now
        else:
            phone_start_time.pop(attempt_id, None)

        # ---------------- FACE/HEAD LOGIC ----------------
        event = face_result["event"]
        
        # A. NO FACE
        if event == "NO_FACE":
            no_face_counter[attempt_id] += 1
            if (
                no_face_counter[attempt_id] >= NO_FACE_THRESHOLD
                and now - last_face_seen[attempt_id] > NO_FACE_TIME_WINDOW
            ):
                log_event("NO_FACE", attempt_id)
                no_face_counter[attempt_id] = 0
            
            # Return early for No Face, but inside lock to ensure safety
            response.update(evaluate_attempt(attempt_id))
            return jsonify(response)

        # Reset No Face if found
        last_face_seen[attempt_id] = now
        no_face_counter[attempt_id] = 0

        # B. HEAD DIRECTION
        current_head = event if event in ["LOOKING_LEFT", "LOOKING_RIGHT"] else "CENTER"
        head_state = head_start_time.get(attempt_id)

        if current_head != "CENTER":
            if not head_state or head_state["direction"] != current_head:
                head_start_time[attempt_id] = {"direction": current_head, "start": now}
            else:
                duration = now - head_state["start"]
                last_logged = last_head_logged.get(attempt_id, 0)

                if duration >= HEAD_DURATION_THRESHOLD:
                    if (now - last_logged > HEAD_COOLDOWN):
                        log_event(current_head, attempt_id)
                        last_head_logged[attempt_id] = now
        else:
            head_start_time.pop(attempt_id, None)

        # C. GAZE DIRECTION
        current_gaze = response["gaze"] if response["gaze"] in ["GAZE_LEFT", "GAZE_RIGHT"] else "CENTER"
        gaze_state = gaze_start_time.get(attempt_id)

        if current_gaze != "CENTER":
            if not gaze_state or gaze_state["direction"] != current_gaze:
                gaze_start_time[attempt_id] = {"direction": current_gaze, "start": now}
            else:
                duration = now - gaze_state["start"]
                last_logged = last_gaze_logged.get(attempt_id, 0)

                if duration >= GAZE_DURATION_THRESHOLD:
                    if (now - last_logged > GAZE_COOLDOWN):
                        log_event(current_gaze, attempt_id)
                        last_gaze_logged[attempt_id] = now
        else:
            gaze_start_time.pop(attempt_id, None)

        # ---------------- IDENTITY VERIFICATION ----------------
        if stored_embedding is not None and live_embedding is not None:
            distance = cosine_distance(stored_embedding, live_embedding)
            
            if distance > FACE_MISMATCH_THRESHOLD:
                face_mismatch_counter[attempt_id] += 1
            else:
                face_mismatch_counter[attempt_id] = 0

            if face_mismatch_counter[attempt_id] >= FACE_MISMATCH_CONSECUTIVE:
                if attempt_id not in identity_warning_issued:
                    log_event("IDENTITY_MISMATCH_WARNING", attempt_id)
                    identity_warning_issued.add(attempt_id)
                    response["warning"] = "IDENTITY_MISMATCH"
                    face_mismatch_counter[attempt_id] = 0
                else:
                    log_event("FACE_MISMATCH", attempt_id)
                    terminate_attempt(attempt_id)
                    response["status"] = "TERMINATED"
                    return jsonify(response)

        # Final Score Update
        response.update(evaluate_attempt(attempt_id))

    return jsonify(response)