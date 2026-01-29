from flask import Blueprint, jsonify 
from db.attempts import auto_flag_abandoned_attempts
from db.connection import get_db 

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/admin/attempts", methods=["GET"])
def admin_attempts():
    try:
        # 🔥 AUTO-FLAG ABANDONED EXAMS
        auto_flag_abandoned_attempts()

        conn, cur = get_db()
        cur.execute("""
            SELECT id, user_id, exam_id, cheating_score, status, started_at
            FROM exam_attempts
            ORDER BY started_at DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        return jsonify([
            {
                "id": r[0],
                "user_id": r[1],
                "exam_id": r[2],
                "cheating_score": r[3],
                "status": r[4],
                "started_at": str(r[5])
            } for r in rows
        ])

    except Exception as e:
        print("ADMIN ATTEMPTS ERROR:", e)
        return jsonify({"error": "Failed to fetch attempts"}), 500

