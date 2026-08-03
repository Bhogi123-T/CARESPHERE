from flask import Blueprint, request, jsonify
from backend.ml.bert_triage import BERTTriageEngine
from backend.ml.lightgbm_risk import LightGBMRiskEngine

risk_bp = Blueprint("risk_bp", __name__)

bert_engine = BERTTriageEngine()
lgbm_engine = LightGBMRiskEngine()


@risk_bp.route("/risk/triage", methods=["POST"])
def triage_symptoms():
    data = request.json
    symptoms = data.get("symptoms", "")

    if not symptoms:
        return jsonify({"msg": "Symptoms text is required"}), 400

    result = bert_engine.classify_symptoms(symptoms)
    return jsonify(result), 200


@risk_bp.route("/risk/maternal", methods=["POST"])
def maternal_risk():
    patient_data = request.json

    if not patient_data:
        return jsonify({"msg": "Patient data is required"}), 400

    result = lgbm_engine.predict_maternal_risk(patient_data)
    return jsonify(result), 200


# Keep the old endpoint for backward compatibility during transition
@risk_bp.route("/risk", methods=["POST"])
def old_risk():
    data = request.json
    symptoms = data.get("symptoms", "")
    result = bert_engine.classify_symptoms(symptoms)
    return jsonify(result), 200
