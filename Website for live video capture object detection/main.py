# backend.py
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
import base64
import json

app = FastAPI()

# CORS setup for React frontend
allowed_origins = [
    "http://localhost:3000",  # React dev server
    "http://localhost"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Load YOLO model
model_weights_path = r"200epoch.pt"
model = YOLO(model_weights_path)
class_names = model.names

# Function to draw bounding boxes on image
def draw_boxes(image, detections):
    for det in detections:
        x1, y1, x2, y2 = int(det["x1"]), int(det["y1"]), int(det["x2"]), int(det["y2"])
        class_name = det["class_name"]
        confidence = det["confidence"]
        label = f"{class_name} {confidence:.2f}"
        color = (0, 255, 0)
        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
        cv2.putText(image, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
    return image

# WebSocket endpoint for live webcam frames
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        try:
            data = await websocket.receive_text()
            img_bytes = base64.b64decode(data)
            img_array = np.frombuffer(img_bytes, dtype=np.uint8)
            frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

            # YOLO detection
            results = model.predict(frame)
            detections = []
            h, w = frame.shape[:2]
            for result in results[0].boxes:
                x1, y1, x2, y2 = result.xyxy[0]
                class_id = int(result.cls[0])
                confidence = float(result.conf[0])
                detections.append({
                    "x1": float(x1),
                    "y1": float(y1),
                    "x2": float(x2),
                    "y2": float(y2),
                    "class_name": class_names[class_id],
                    "confidence": confidence
                })

            annotated = draw_boxes(frame, detections)
            _, buffer = cv2.imencode(".jpg", annotated)
            frame_base64 = base64.b64encode(buffer).decode("utf-8")

            # Send both image and detection data as JSON
            response_data = {
                "image": frame_base64,
                "detections": detections
            }
            await websocket.send_text(json.dumps(response_data))
        except Exception as e:
            print("WebSocket Error:", e)
            break
