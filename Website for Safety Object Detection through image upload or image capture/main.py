from fastapi import FastAPI, File, UploadFile
import cv2
import numpy as np
from ultralytics import YOLO
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import base64
import os

app = FastAPI()

# Set correct path for your weights
model_weights_path = r"200epoch.pt"
model = YOLO(model_weights_path)
class_names = model.names

allowed_origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/detect/")
async def detect_objects(file: UploadFile):
    image_bytes = await file.read()
    image = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    # Get image dimensions for normalization
    img_height, img_width = image.shape[:2]

    results = model.predict(image)

    detections = []
    for result in results[0].boxes:
        x1, y1, x2, y2 = result.xyxy[0]
        confidence = result.conf[0]
        class_id = int(result.cls[0])
        
        # Calculate normalized coordinates (0-1 range)
        norm_x1 = float(x1) / img_width
        norm_y1 = float(y1) / img_height
        norm_x2 = float(x2) / img_width
        norm_y2 = float(y2) / img_height
        
        detections.append({
            "x1": float(x1),
            "y1": float(y1),
            "x2": float(x2),
            "y2": float(y2),
            "norm_x1": norm_x1,
            "norm_y1": norm_y1,
            "norm_x2": norm_x2,
            "norm_y2": norm_y2,
            "confidence": float(confidence),
            "class_id": class_id,
            "class_name": class_names[class_id]
        })

    # Draw boxes on image in memory
    annotated_image = draw_boxes(image, detections)

    # Encode as JPEG and then as base64
    _, img_encoded = cv2.imencode('.jpg', annotated_image)
    img_base64 = base64.b64encode(img_encoded.tobytes()).decode('utf-8')

    # Return the detections and the result image (as base64 string)
    return JSONResponse({"detections": detections, "image_base64": img_base64})
