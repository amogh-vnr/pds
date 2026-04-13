import os
import io
import cv2
import numpy as np
import torch
import torch.nn.functional as F
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torchvision import transforms

from model_arch import ResNet50_CBAM_Binary

app = FastAPI(title="Psoriasis Detection API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEVICE = torch.device('cpu')
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'model.pth')

# Load the model
try:
    model = ResNet50_CBAM_Binary(n_classes=2)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()
except Exception as e:
    print(f"Failed to load model from {MODEL_PATH}. Error: {e}")
    # In case of missing model.pth during build step, we don't crash
    model = None

# Transformations
IMG_SIZE = 256
tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def smart_roi_crop(img: Image.Image) -> Image.Image:
    """Cropping roughly the region of interest similar to training."""
    img_np = np.array(img)
    if len(img_np.shape) == 3 and img_np.shape[2] == 3: # Handle grayscale differently if needed
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    else:
        gray = img_np
        
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_OTSU)
    coords = np.column_stack(np.where(thresh > 0))

    if len(coords) > 0:
        y0, x0 = coords.min(axis=0)
        y1, x1 = coords.max(axis=0)
        # Ensure we actually have an area to crop
        if y1 > y0 and x1 > x0:
            img_np = img_np[y0:y1, x0:x1]

    return Image.fromarray(img_np)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded.")
        
    # Validation: Only allow certain extensions
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp')):
        raise HTTPException(status_code=400, detail="File must be an image (.jpg, .png, .jpeg, .webp, .bmp)")

    try:
        # Read the file contents. This inherently handles files with spaces in names
        # since we don't save it to the disk.
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    try:
        # Preprocessing matching the provided pipeline
        image = smart_roi_crop(image)
        input_tensor = tf(image).unsqueeze(0) # add batch dimension
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error processing the image.")

    with torch.no_grad():
        out = model(input_tensor)
        # The output is of size [1, 2] corresponding to non_psoriasis (0) and psoriasis (1)
        probs = F.softmax(out, dim=1)
        psoriasis_prob = probs[0, 1].item()

    # Determine class
    prediction = "Psoriasis" if psoriasis_prob > 0.5 else "Normal"
    confidence = psoriasis_prob if prediction == "Psoriasis" else (1.0 - psoriasis_prob)
    
    return {
        "prediction": prediction,
        "confidence": round(confidence * 100, 2)
    }

@app.get("/")
def read_root():
    return {"message": "Psoriasis Detection API is running"}
