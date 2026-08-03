from flask import Blueprint, request, jsonify
import re
import os
import joblib

agent_bp = Blueprint("agent", __name__)

# Load ML Models if available
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.join(os.path.dirname(current_dir), "ml")
model_path = os.path.join(ml_dir, "risk_model.pkl")
vectorizer_path = os.path.join(ml_dir, "vectorizer.pkl")

rf_model = None
vectorizer = None

try:
    if os.path.exists(model_path) and os.path.exists(vectorizer_path):
        rf_model = joblib.load(model_path)
        vectorizer = joblib.load(vectorizer_path)
except Exception as e:
    print(f"Error loading ML model in agent: {e}")


def analyze_intent(text):
    text_lower = text.lower()

    # 1. First Aid Intent
    if any(
        word in text_lower
        for word in ["how to", "what to do", "first aid", "cpr", "help me treat"]
    ):
        return {
            "action": "FIRST_AID",
            "response": "I can help with first aid. I am opening the offline first aid instructions for you now.",
            "payload": None,
        }

    # ML INTEGRATION for SOS
    if rf_model and vectorizer:
        try:
            # Vectorize input
            X_input = vectorizer.transform([text])

            # Predict risk
            risk_pred = rf_model.predict(X_input)[0]

            # Since our dataset classes are CRITICAL, HIGH, LOW, we map them
            if risk_pred in ["CRITICAL", "HIGH"]:
                # Attempt to extract payload code based on keywords, fallback to G01
                payload = "G01"
                if any(word in text_lower for word in ["chest", "heart", "pulse"]):
                    payload = "H01"
                elif any(word in text_lower for word in ["snake", "bite", "poison"]):
                    payload = "S01"
                elif any(
                    word in text_lower for word in ["bleed", "blood", "cut", "trauma"]
                ):
                    payload = "A01"
                elif any(
                    word in text_lower for word in ["breathe", "choking", "asthma"]
                ):
                    payload = "B01"
                elif any(word in text_lower for word in ["pregnant", "labor", "baby"]):
                    payload = "P01"

                return {
                    "action": "TRIGGER_SOS",
                    "response": f"AI Risk Assessment: {risk_pred}. This sounds like a medical emergency. I am triggering an SOS alert immediately. Stay calm.",
                    "payload": payload,
                    "ml_risk": risk_pred,
                }
        except Exception as e:
            print(f"ML Inference error: {e}")
            pass  # Fallback to regex

    # 2. Fallback SOS Intents (Regex)
    if any(word in text_lower for word in ["chest", "heart attack", "heart", "pulse"]):
        return {
            "action": "TRIGGER_SOS",
            "response": "This sounds like a cardiac emergency. I am triggering a critical SOS alert for Heart Conditions immediately. Stay calm.",
            "payload": "H01",
        }

    if any(
        word in text_lower for word in ["snake", "bite", "poison", "scorpion", "spider"]
    ):
        return {
            "action": "TRIGGER_SOS",
            "response": "I understand there is a bite or poison emergency. I am sending an SOS alert now. Please keep the patient still and do not apply a tourniquet.",
            "payload": "S01",
        }

    if any(
        word in text_lower
        for word in ["bleed", "blood", "accident", "cut", "trauma", "broken"]
    ):
        return {
            "action": "TRIGGER_SOS",
            "response": "This sounds like severe trauma. I am dispatching an SOS alert. Please apply firm pressure to any bleeding wounds.",
            "payload": "A01",
        }

    if any(word in text_lower for word in ["breathe", "choking", "airway", "asthma"]):
        return {
            "action": "TRIGGER_SOS",
            "response": "Breathing emergencies are critical. I am triggering an SOS now.",
            "payload": "B01",
        }

    if any(
        word in text_lower
        for word in ["pregnant", "labor", "baby", "water broke", "delivery"]
    ):
        return {
            "action": "TRIGGER_SOS",
            "response": "Maternal emergency detected. I am requesting an ambulance with maternal care support immediately.",
            "payload": "P01",
        }

    if any(
        word in text_lower
        for word in ["emergency", "help", "sos", "ambulance", "dying", "collapse"]
    ):
        return {
            "action": "TRIGGER_SOS",
            "response": "I am triggering a general SOS emergency alert right now. Help is on the way.",
            "payload": "G01",
        }

    # 3. Default Conversational
    return {
        "action": "NONE",
        "response": "I am CareSphere AI. I am monitoring your health and can assist in emergencies. Please describe your symptoms or ask for help if you need an ambulance.",
        "payload": None,
    }


@agent_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "")
    language = data.get("language", "en-US")

    if not message:
        return jsonify({"error": "No message provided"}), 400

    # Phase 3: Multilingual AI Voice Triage Simulation
    translated_message = message
    if language != "en-US":
        print(f"--- MULTILINGUAL TRANSLATION SIMULATION ---")
        print(f"Original ({language}): {message}")
        # In a real app, we would call an NLP translation API (e.g. AWS Translate or Bhashini) here.
        # We will mock it by simply passing it to the intent analyzer.
        translated_message = f"{message} (Translated from {language})"
        print(f"Translated to English: {translated_message}")
        print(f"---------------------------------------------")

    analysis = analyze_intent(translated_message)

    return jsonify(analysis), 200
