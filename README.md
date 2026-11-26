# Leaf Doctor

Leaf Doctor helps farmers check tomato leaves for disease. Upload a leaf photo and get the likely disease, a confidence score, and treatment and prevention steps. If the app is not sure, it advises consulting an expert.

## Structure
- `backend/`: FastAPI server with `POST /predict` and `GET /health`
- `frontend/`: React + Vite + Tailwind web app

## Run the backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then add your GEMINI_API_KEY inside .env
uvicorn app.main:app --reload
```
Open http://127.0.0.1:8000/docs to test.

## Run the frontend
```bash
cd frontend
npm install
cp .env.example .env   # VITE_USE_MOCK=true runs without the backend
npm run dev
```
Open http://localhost:5173.

## Build the frontend
```bash
npm run build
```

## Note
The diagnosis uses the Gemini API. Never commit `.env` or API keys.
