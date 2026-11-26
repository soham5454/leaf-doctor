from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


class TopPrediction(BaseModel):
    label: str
    confidence: float


class Guidance(BaseModel):
    symptoms: list[str]
    treatment: list[str]
    prevention: list[str]


class PredictResponse(BaseModel):
    disease: str
    display_name: str
    confidence: float
    status: str
    top_predictions: list[TopPrediction]
    guidance: Guidance
