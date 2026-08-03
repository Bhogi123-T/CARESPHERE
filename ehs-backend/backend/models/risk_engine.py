import os
import joblib

# Cache the loaded model and vectorizer
_model = None
_vectorizer = None


def load_ml_model():
    global _model, _vectorizer
    if _model is None or _vectorizer is None:
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            ml_dir = os.path.join(os.path.dirname(current_dir), "ml")
            model_path = os.path.join(ml_dir, "risk_model.pkl")
            vectorizer_path = os.path.join(ml_dir, "vectorizer.pkl")

            if os.path.exists(model_path) and os.path.exists(vectorizer_path):
                _model = joblib.load(model_path)
                _vectorizer = joblib.load(vectorizer_path)
                return True
        except Exception as e:
            print(f"Error loading ML model: {e}")
    return _model is not None and _vectorizer is not None


def calculate_risk(symptoms):
    # Try ML model first
    if load_ml_model():
        try:
            features = _vectorizer.transform([symptoms])
            prediction = _model.predict(features)[0]

            if prediction == "HIGH":
                return {
                    "risk": "HIGH",
                    "action": "EMERGENCY",
                    "message": "ML Prediction: Call ambulance immediately",
                }
            elif prediction == "MEDIUM":
                return {
                    "risk": "MEDIUM",
                    "action": "CONSULT",
                    "message": "ML Prediction: Visit doctor soon",
                }
            else:
                return {
                    "risk": "LOW",
                    "action": "SELF_CARE",
                    "message": "ML Prediction: Home care is sufficient",
                }
        except Exception as e:
            print(f"ML prediction failed, falling back to keywords: {e}")

    # Fallback keyword logic
    symptoms = symptoms.lower()

    high_risk = [
        "chest pain",
        "breathing difficulty",
        "snake",
        "insect bite",
        "poison",
        "pesticide",
        "accident",
        "trauma",
        "maternal",
        "pregnancy",
        "stroke",
        "severe bleeding",
        "seizure",
        "burn",
        "heart attack",
        "unconscious",
        "allergic reaction",
        "choking",
        "cardiac arrest",
        "aortic dissection",
        "aneurysm",
        "anaphylaxis",
        "ectopic",
        "placental abruption",
        "eclampsia",
        "status asthmaticus",
        "arterial bleeding",
    ]

    medium_risk = [
        "fever",
        "body pain",
        "fracture",
        "deep cut",
        "vomiting",
        "dehydration",
        "dizzy",
        "head trauma",
        "asthma",
    ]

    low_risk = [
        "headache",
        "minor cut",
        "rash",
        "stomach ache",
        "cold",
        "cough",
        "sore throat",
        "nausea",
    ]

    if any(k in symptoms for k in high_risk):
        return {
            "risk": "HIGH",
            "action": "EMERGENCY",
            "message": "Call ambulance immediately",
        }
    elif any(k in symptoms for k in medium_risk):
        return {"risk": "MEDIUM", "action": "CONSULT", "message": "Visit doctor soon"}
    elif any(k in symptoms for k in low_risk):
        return {
            "risk": "LOW",
            "action": "SELF_CARE",
            "message": "Home care is sufficient",
        }
    else:
        return {
            "risk": "LOW",
            "action": "SELF_CARE",
            "message": "Monitor symptoms and consult if worsens",
        }
