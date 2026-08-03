from flask import Blueprint, request, jsonify
from backend.models import PatientProfile
from backend.extensions import db

abdm_bp = Blueprint("abdm_bp", __name__)


@abdm_bp.route("/fetch-profile", methods=["POST"])
def fetch_abdm_profile():
    data = request.json
    abha_id = data.get("abha_id")
    patient_id = data.get("patient_id")

    if not abha_id or len(abha_id.replace("-", "")) != 14:
        return jsonify({"msg": "Invalid ABHA ID format. Must be 14 digits."}), 400

    # Simulate a network call to ABDM Sandbox
    import time

    time.sleep(1.5)

    # Mock data returned from National Health Authority (NHA)
    mock_health_records = {
        "medical_history": "Hypertension (Diagnosed 2018), Type 2 Diabetes",
        "blood_group": "O+",
        "allergies": "Penicillin, Peanuts",
        "past_surgeries": "Appendectomy (2012)",
    }

    # Update the patient profile with the fetched data
    profile = PatientProfile.query.filter_by(user_id=patient_id).first()
    if profile:
        profile.medical_history = f"{mock_health_records['medical_history']} | Allergies: {mock_health_records['allergies']} | Surgeries: {mock_health_records['past_surgeries']}"
        profile.blood_group = mock_health_records["blood_group"]
        db.session.commit()

        return (
            jsonify(
                {
                    "msg": "Health records synced successfully from ABDM",
                    "data": mock_health_records,
                }
            ),
            200,
        )

    return jsonify({"msg": "Patient profile not found"}), 404
