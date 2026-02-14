from db.connection import get_db


# ---------------------------------------------------
# GET EVENT WEIGHT (Uses existing cursor)
# ---------------------------------------------------
def get_event_weight(cur, event_type):
    cur.execute(
        "SELECT weight FROM event_weights WHERE event_type = %s",
        (event_type,)
    )
    row = cur.fetchone()
    return row[0] if row else 1


# ---------------------------------------------------
# LOG EVENT
# ---------------------------------------------------
def log_event(event_type, attempt_id):
    conn, cur = get_db()

    try:
        # -------------------------------
        # Validate attempt exists
        # -------------------------------
        cur.execute(
            "SELECT status FROM exam_attempts WHERE id = %s",
            (attempt_id,)
        )
        row = cur.fetchone()

        if not row:
            print(f"[ERROR] Attempt {attempt_id} not found")
            return

        status = row[0]

        # -------------------------------
        # Skip if already closed
        # -------------------------------
        if status in ("TERMINATED", "COMPLETED"):
            print(f"[SKIPPED] {event_type} | Attempt {attempt_id} already {status}")
            return

        # -------------------------------
        # Get weight (reuse cursor)
        # -------------------------------
        weight = get_event_weight(cur, event_type)

        # -------------------------------
        # Insert cheating event
        # -------------------------------
        cur.execute("""
            INSERT INTO cheating_events (
                attempt_id,
                event_type,
                weight,
                created_at
            )
            VALUES (%s, %s, %s, NOW())
        """, (attempt_id, event_type, weight))

        # -------------------------------
        # Update cheating score
        # -------------------------------
        cur.execute("""
            UPDATE exam_attempts
            SET cheating_score = cheating_score + %s
            WHERE id = %s
        """, (weight, attempt_id))

        conn.commit()

        print(f"[DB LOG] {event_type} (+{weight}) | Attempt {attempt_id}")

    except Exception as e:
        conn.rollback()
        print("LOG EVENT ERROR:", e)

    finally:
        cur.close()
        conn.close()
