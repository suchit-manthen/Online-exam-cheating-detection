from flask import Blueprint, request, jsonify
import cv2
import numpy as np
import base64
import time

from proctoring.face import analyze_face
from proctoring.phone import detect_phone
from db.events import log_event
from db.attempts import evaluate_attempt

proctoring_bp = Blueprint("proctoring", __name__)

# -------------------------------
# Cooldowns (route-level state)
# -------------------------------
last_face_log = {}
last_phone_log = {}

FACE_COOLDOWN = 2      # seconds
PHONE_COOLDOWN = 3     # seconds

# -------------------------------
# ANALYZE FRAME
# -------------------------------
@proctoring_bp.route("/analyze-frame", methods=["POST"])
def analyze_frame():
    data = request.json
    image = data["image"]
    attempt_id = data["attempt_id"]

    # ---------- Decode Image ----------
    image_bytes = base64.b64decode(image.split(",")[1])
    np_arr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    response = {
        "faces_detected": 0,
        "direction": "CENTER",
        "phone_detected": False,
        "status": None,
        "warning": None
    }

    now = time.time()

    # ---------- PHONE DETECTION ----------
    phone_detected = detect_phone(frame)
    response["phone_detected"] = phone_detected

    if phone_detected:
        last_time = last_phone_log.get(attempt_id, 0)
        if now - last_time > PHONE_COOLDOWN:
            log_event("PHONE_DETECTED", attempt_id)
            last_phone_log[attempt_id] = now

    # ---------- FACE ANALYSIS ----------
    face_result = analyze_face(frame)

    response["faces_detected"] = face_result["faces_detected"]
    response["direction"] = face_result["direction"]

    if face_result["event"]:
        last_time = last_face_log.get((attempt_id, face_result["event"]), 0)
        if now - last_time > FACE_COOLDOWN:
            log_event(face_result["event"], attempt_id)
            last_face_log[(attempt_id, face_result["event"])] = now

    # ---------- SCORE EVALUATION ----------
    evaluation = evaluate_attempt(attempt_id)
    response.update(evaluation)

    return jsonify(response)
