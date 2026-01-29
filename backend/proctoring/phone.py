from ultralytics import YOLO 

phone_model = YOLO("yolo11n.pt")
PHONE_LOG_COOLDOWN = 3 
PHONE_CLASS_ID = 67 

def detect_phone(frame): 
    results = phone_model.predict(frame, conf=0.45, verbose=False)

    for r in results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            if int(box.cls[0]) == PHONE_CLASS_ID:
                return True

    return False