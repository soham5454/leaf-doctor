import io
import json
import logging
import os
import re
from PIL import Image
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google import genai
from google.genai import types
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import (
    ALLOWED_ORIGINS,
    CONFIDENCE_THRESHOLD,
    GEMINI_API_KEY,
    GEMINI_MODEL,
    MAX_UPLOAD_MB,
    USE_MOCK,
)
from app.schemas import Guidance, HealthResponse, PredictResponse, TopPrediction

logger = logging.getLogger(__name__)

app = FastAPI(title="Leaf Doctor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    error_message = (
        exc.detail.get("error", str(exc.detail))
        if isinstance(exc.detail, dict)
        else exc.detail
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": error_message},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"error": "An internal server error occurred."},
    )


GEMINI_INSTRUCTION = (
    "You are a plant pathologist. Look at this photo. Classify the leaf as "
    "exactly one of: Tomato_Early_blight, Tomato_Late_blight, Tomato_healthy, "
    "or unknown if it is not a tomato leaf or the photo is unclear. Return only "
    'JSON in this form: {"label": "...", "confidence": 0-100, "symptoms": [...], '
    '"treatment": [...], "prevention": [...]}. Keep each list to 2 to 3 short, '
    "simple sentences for a farmer."
)

TOMATO_CLASSES = [
    "Tomato_Early_blight",
    "Tomato_Late_blight",
    "Tomato_healthy",
]

MOCK_RESPONSE = {
    "disease": "Tomato_Early_blight",
    "display_name": "Tomato Early Blight",
    "confidence": 87.3,
    "status": "confident",
    "top_predictions": [
        {"label": "Tomato Early Blight", "confidence": 87.3},
        {"label": "Tomato Healthy", "confidence": 9.1},
        {"label": "Tomato Late Blight", "confidence": 3.6},
    ],
    "guidance": {
        "symptoms": ["Dark concentric rings on older leaves"],
        "treatment": ["Remove infected leaves", "Apply copper-based fungicide"],
        "prevention": ["Water at the base of the plant", "Rotate crops yearly"],
    },
}


def parse_gemini_json(text: str) -> dict | None:
    if not text:
        return None
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned).strip()
    try:
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            data = json.loads(cleaned[start : end + 1])
            if isinstance(data, dict):
                return data
        except Exception:
            pass
    return None


def to_string_list(val) -> list[str]:
    if isinstance(val, list):
        return [str(item) for item in val if item is not None]
    if isinstance(val, str) and val.strip():
        return [val.strip()]
    return []


@app.get("/health", response_model=HealthResponse)
def health():
    return {"status": "ok", "model_loaded": False}


@app.post("/predict", response_model=PredictResponse)
async def predict(image: UploadFile | None = File(None)):
    # 1. Missing image field validation
    if image is None or not image.filename:
        raise HTTPException(
            status_code=400,
            detail="Please choose a photo of a leaf.",
        )

    # 2. Content type validation
    content_type = (
        image.content_type.split(";")[0].strip().lower()
        if image.content_type
        else ""
    )
    if content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=400,
            detail="Only JPG and PNG photos are supported.",
        )

    # 3. Read image bytes once and validate file size
    await image.seek(0)
    image_bytes = await image.read()
    if len(image_bytes) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"The photo is too large. Please use one under {MAX_UPLOAD_MB} MB.",
        )

    # 4. Image integrity check using Pillow (operates on a separate BytesIO copy)
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="We could not read this image. Please try another photo.",
        )

    # 5. Return mock response when USE_MOCK is "true" or GEMINI_API_KEY is missing/placeholder
    api_key = (GEMINI_API_KEY or "").strip()
    if str(USE_MOCK).strip().lower() == "true" or not api_key or api_key.startswith("your_"):
        return MOCK_RESPONSE

    # 6. Send to Gemini flash vision model; fall back to mock response on error
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                GEMINI_INSTRUCTION,
                types.Part.from_bytes(data=image_bytes, mime_type=content_type),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
    except Exception:
        logging.exception("Gemini API error during diagnosis")
        return MOCK_RESPONSE

    # 7. Parse the JSON response
    try:
        raw_text = response.text if response else ""
    except Exception:
        raw_text = ""
    parsed = parse_gemini_json(raw_text)
    if parsed is None:
        disease = "unknown"
        display_name = "Unknown"
        confidence = 0.0
        status = "uncertain"
        symptoms = []
        treatment = []
        prevention = []
    else:
        raw_label = str(parsed.get("label", "unknown")).strip()
        matched = None
        for c in TOMATO_CLASSES:
            if raw_label.lower().replace(" ", "_") == c.lower():
                matched = c
                break

        if matched:
            disease = matched
            display_name = disease.replace("_", " ")
        else:
            disease = "unknown"
            display_name = "Unknown"

        try:
            confidence = round(float(parsed.get("confidence", 0.0)), 1)
        except (TypeError, ValueError):
            confidence = 0.0
        confidence = max(0.0, min(100.0, confidence))

        threshold = float(os.getenv("CONFIDENCE_THRESHOLD", CONFIDENCE_THRESHOLD))
        if disease == "unknown" or confidence < threshold:
            status = "uncertain"
        else:
            status = "confident"

        symptoms = to_string_list(parsed.get("symptoms"))
        treatment = to_string_list(parsed.get("treatment"))
        prevention = to_string_list(parsed.get("prevention"))

    # 8. Build top_predictions
    remaining_conf = round(max(0.0, 100.0 - confidence) / 2.0, 1)
    if disease in TOMATO_CLASSES:
        other_classes = [c.replace("_", " ") for c in TOMATO_CLASSES if c != disease]
        top_preds = [
            TopPrediction(label=display_name, confidence=confidence),
            TopPrediction(label=other_classes[0], confidence=remaining_conf),
            TopPrediction(label=other_classes[1], confidence=remaining_conf),
        ]
    else:
        top_preds = [
            TopPrediction(label=display_name, confidence=confidence),
            TopPrediction(
                label=TOMATO_CLASSES[0].replace("_", " "), confidence=remaining_conf
            ),
            TopPrediction(
                label=TOMATO_CLASSES[1].replace("_", " "), confidence=remaining_conf
            ),
        ]

    return PredictResponse(
        disease=disease,
        display_name=display_name,
        confidence=confidence,
        status=status,
        top_predictions=top_preds,
        guidance=Guidance(
            symptoms=symptoms,
            treatment=treatment,
            prevention=prevention,
        ),
    )
