from db.connection import get_db 


def get_event_weight(event_type):
    conn, cur = get_db()
    cur.execute(
        "SELECT weight FROM event_weights WHERE event_type=%s",
        (event_type,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row[0] if row else 1

def log_event(event_type, attempt_id):
    weight = get_event_weight(event_type)
    conn, cur = get_db()

    cur.execute("""
        INSERT INTO cheating_events (attempt_id, event_type, weight)
        VALUES (%s, %s, %s)
    """, (attempt_id, event_type, weight))

    cur.execute("""
        UPDATE exam_attempts
        SET cheating_score = cheating_score + %s
        WHERE id = %s
    """, (weight, attempt_id))

    conn.commit()
    cur.close()
    conn.close()

    print(f"DB LOG: {event_type} (+{weight})")
