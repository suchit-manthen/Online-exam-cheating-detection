from flask import Blueprint, request, jsonify
from db.events import log_event
from db.attempts import evaluate_attempt

frontend_bp = Blueprint("frontend_events", __name__)

# -------------------------------
# FRONTEND EVENTS
# -------------------------------
@frontend_bp.route("/log-event", methods=["POST"])
def log_frontend_event():
    """
    Handles browser-based cheating events
    Examples:
    - TAB_SWITCH
    - WINDOW_BLUR
    - COPY_PASTE
    - DEVTOOLS_OPEN
    - PAGE_EXIT
    """

    data = request.json or {}
    event_type = data.get("event")
    attempt_id = data.get("attempt_id")

    if not event_type or not attempt_id:
        return jsonify({"error": "Invalid data"}), 400

    # Log the event
    log_event(event_type, attempt_id)

    # Re-evaluate attempt after logging
    result = evaluate_attempt(attempt_id)

    return jsonify(result)
