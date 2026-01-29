from flask import Blueprint, request, jsonify 
import uuid 
import psycopg2
from config import DATABASE_URL

exam_bp = Blueprint("exam", __name__)

def get_db(): 
    conn = psycopg2.connect(DATABASE_URL)
    return conn, conn.cursor()


# -----------------------------------
# Start Exam
# -----------------------------------
@exam_bp.route("/start-exam", methods=["POST"])
def start_exam():
    data = request.json or {}
    exam_id = data.get("exam_id", "ai_exam_1")
    student_id = f"student_{uuid.uuid4().hex[:6]}"

    conn, cur = get_db()
    cur.execute("""
        INSERT INTO exam_attempts (user_id, exam_id, status)
        VALUES (%s, %s, 'ONGOING')
        RETURNING id
    """, (student_id, exam_id))

    attempt_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "attempt_id": attempt_id,
        "student_id": student_id
    })


# -----------------------------------
# END EXAM
# -----------------------------------
@exam_bp.route("/end-exam", methods=["POST"])
def end_exam():
    attempt_id = request.json["attempt_id"]

    conn, cur = get_db()
    cur.execute(
        "SELECT cheating_score FROM exam_attempts WHERE id=%s",
        (attempt_id,)
    )
    score = cur.fetchone()[0]

    status = "TERMINATED" if score >= 15 else "COMPLETED"

    cur.execute("""
        UPDATE exam_attempts
        SET status=%s, ended_at=NOW()
        WHERE id=%s
    """, (status, attempt_id))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"status": status, "score": score})
