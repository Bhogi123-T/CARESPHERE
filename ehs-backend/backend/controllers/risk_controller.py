from flask import Blueprint, request, jsonify
from backend.models.risk_engine import calculate_risk

risk_bp = Blueprint("risk_bp", __name__)

@risk_bp.route("/risk", methods=["POST"])
def risk():
    data = request.json
    symptoms = data.get("symptoms")

    result = calculate_risk(symptoms)
    return jsonify(result)
