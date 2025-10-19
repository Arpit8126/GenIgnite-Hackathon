from ultralytics import YOLO
import torch

EPOCHS = 200
MOSAIC = 0.4
OPTIMIZER = 'AdamW'
MOMENTUM = 0.9
LR0 = 0.0001
LRF = 0.0001
SINGLE_CLS = False

device = 0 if torch.cuda.is_available() else 'cpu'

model = YOLO("yolov8s.pt")

results = model.train(
    data="yolo_params.yaml",
    epochs=EPOCHS,
    device=device,
    single_cls=SINGLE_CLS,
    mosaic=MOSAIC,
    optimizer=OPTIMIZER,
    lr0=LR0,
    lrf=LRF,
    momentum=MOMENTUM
)