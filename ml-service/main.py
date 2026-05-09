"""
Smart City ML Microservice — Isolation Forest Anomaly Detection
FastAPI + scikit-learn

Install:  pip install fastapi uvicorn scikit-learn numpy
Run:      uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from sklearn.ensemble import IsolationForest
import time

app = FastAPI(title="SmartCity ML Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Train Isolation Forest on synthetic normal city data ─────────
np.random.seed(42)
N = 2000
NORMAL_DATA = np.column_stack([
    np.random.normal(28, 5, N),    # temperature  ~28°C
    np.random.normal(60, 15, N),   # humidity     ~60%
    np.random.normal(60, 25, N),   # aqi          ~60
    np.random.normal(52, 12, N),   # noise        ~52 dB
    np.random.normal(40, 20, N),   # traffic      ~40%
    np.random.normal(120, 40, N),  # power        ~120 kW
])

model = IsolationForest(
    n_estimators=200,
    contamination=0.08,   # 8% expected anomalies
    max_features=1.0,
    random_state=42,
)
model.fit(NORMAL_DATA)
print("[ML] Isolation Forest trained on", N, "samples")

# ── Request/Response schemas ────────────────────────────────────
class SensorReading(BaseModel):
    temperature: float
    humidity: float
    air_quality_index: float
    noise_level: float
    traffic_density: float
    power_consumption: float

class PredictionResponse(BaseModel):
    anomaly_score: float      # raw score from Isolation Forest
    is_anomaly: bool          # True if score > threshold
    confidence: float         # 0-1
    severity: str             # normal / low / medium / high / critical
    features_used: list[str]
    method: str

# ── Helper ───────────────────────────────────────────────────────
def score_to_severity(score: float, is_anomaly: bool) -> str:
    if not is_anomaly:
        return "normal"
    if score > 0.7:
        return "critical"
    if score > 0.5:
        return "high"
    if score > 0.3:
        return "medium"
    return "low"

# ── Routes ───────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model": "IsolationForest", "version": "2.0.0", "timestamp": time.time()}

@app.post("/predict", response_model=PredictionResponse)
def predict(reading: SensorReading):
    X = np.array([[
        reading.temperature,
        reading.humidity,
        reading.air_quality_index,
        reading.noise_level,
        reading.traffic_density,
        reading.power_consumption,
    ]])

    # sklearn returns -1 (anomaly) or 1 (normal)
    prediction = model.predict(X)[0]
    raw_score  = model.decision_function(X)[0]  # more negative = more anomalous

    # Normalise score to 0-1 range (0=normal, 1=critical anomaly)
    anomaly_score = float(np.clip((-raw_score + 0.2) / 0.6, 0, 1))
    is_anomaly    = prediction == -1
    confidence    = round(anomaly_score if is_anomaly else 1 - anomaly_score, 3)
    severity      = score_to_severity(anomaly_score, is_anomaly)

    return PredictionResponse(
        anomaly_score=round(anomaly_score, 4),
        is_anomaly=is_anomaly,
        confidence=confidence,
        severity=severity,
        features_used=["temperature","humidity","air_quality_index","noise_level","traffic_density","power_consumption"],
        method="IsolationForest",
    )

@app.post("/batch")
def batch_predict(readings: list[SensorReading]):
    results = [predict(r) for r in readings]
    return {"success": True, "count": len(results), "results": [r.dict() for r in results]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
