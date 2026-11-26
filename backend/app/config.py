import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the project root so it works from any working directory
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Comma-separated list of frontend URLs allowed to call the API
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

# No default value and never hardcoded. Set it in the environment only.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
USE_MOCK = os.getenv("USE_MOCK", "false").strip().lower()

MODEL_PATH = os.getenv("MODEL_PATH", "artifacts/model.pt")
LABELS_PATH = os.getenv("LABELS_PATH", "artifacts/labels.json")
GUIDANCE_PATH = os.getenv("GUIDANCE_PATH", "artifacts/guidance.json")
IMAGE_SIZE = int(os.getenv("IMAGE_SIZE", "128"))
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "60"))
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "5"))
