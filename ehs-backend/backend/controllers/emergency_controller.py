from flask import Blueprint, request, jsonify
from backend.models import Emergency

emergency_bp = Blueprint("emergency_bp", __name__)


@emergency_bp.route("/emergencies", methods=["GET"])
def get_emergencies_list():
    # Return all emergencies from SQLite database
    emergencies = Emergency.query.all()
    records = [
        {
            "id": e.id,
            "patient_id": e.patient_id,
            "symptoms": e.symptoms,
            "risk_level": e.risk_level,
            "status": e.status,
            "location": {"lat": e.lat, "lng": e.lng} if e.lat else None,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in emergencies
    ]
    return jsonify(records)


from backend.extensions import db
from datetime import datetime
from backend.models import Volunteer


@emergency_bp.route("/resolve", methods=["POST"])
def resolve_emergency():
    data = request.json
    emergency_id = data.get("emergency_id")

    emergency = Emergency.query.get(emergency_id)
    if not emergency:
        return jsonify({"msg": "Emergency not found"}), 404

    emergency.status = "RESOLVED"
    emergency.resolved_at = datetime.utcnow()

    from backend.utils.blockchain import create_audit_block

    create_audit_block(
        "EMERGENCY_RESOLVED",
        {
            "emergency_id": emergency.id,
            "resolved_at": emergency.resolved_at.isoformat(),
        },
    )

    db.session.commit()

    return jsonify({"msg": "Emergency marked as resolved"}), 200


@emergency_bp.route("/volunteer/rate", methods=["POST"])
def rate_volunteer():
    data = request.json
    volunteer_id = data.get("volunteer_id")
    rating = data.get("rating")

    volunteer = Volunteer.query.get(volunteer_id)
    if not volunteer:
        return jsonify({"msg": "Volunteer not found"}), 404

    # Simple moving average for demonstration
    volunteer.rating = (volunteer.rating + float(rating)) / 2.0
    db.session.commit()

    return (
        jsonify(
            {"msg": "Rating submitted successfully", "new_rating": volunteer.rating}
        ),
        200,
    )


from utils.geo import haversine_distance
from backend.models import User
import random
from backend.utils.blockchain import create_audit_block


@emergency_bp.route("/auto-dispatch", methods=["POST"])
def auto_dispatch():
    data = request.json
    emergency_id = data.get("emergency_id")

    emergency = Emergency.query.get(emergency_id)
    if not emergency or emergency.status != "PENDING":
        return jsonify({"msg": "Valid pending emergency not found"}), 404

    ambulances = User.query.filter_by(role="ambulance").all()
    if not ambulances:
        return jsonify({"msg": "No ambulances available"}), 404

    best_ambulance = None
    max_score = -float("inf")
    best_distance = 0

    # Weights from the CareSphere research paper (Algorithm 1)
    alpha = 0.5  # Distance weight
    beta = 0.3  # Capability weight
    gamma = 0.2  # Availability weight

    symptoms_lower = (emergency.symptoms or "").lower()
    needs_maternal = "preg" in symptoms_lower or "matern" in symptoms_lower
    needs_cardiac = "chest" in symptoms_lower or "heart" in symptoms_lower

    for amb in ambulances:
        # Mocking ambulance locations randomly around the city for demo
        amb_lat = (emergency.lat or 17.3850) + random.uniform(-0.1, 0.1)
        amb_lng = (emergency.lng or 78.4867) + random.uniform(-0.1, 0.1)

        # 1. Distance Factor (inverse)
        dist = haversine_distance(emergency.lat, emergency.lng, amb_lat, amb_lng)
        # Prevent division by zero; add small epsilon
        d_factor = 1.0 / (dist + 0.1)

        # 2. Capability Factor (Simulated based on ambulance ID parity for demonstration)
        # In a real db, Ambulance model would have 'capabilities': ['cardiac', 'maternal']
        has_cardiac_support = amb.id % 2 == 0
        has_maternal_support = amb.id % 3 == 0

        capability_score = 0.5  # Baseline capability
        if needs_cardiac and has_cardiac_support:
            capability_score = 1.0
        elif needs_maternal and has_maternal_support:
            capability_score = 1.0

        # 3. Availability Factor
        availability_score = 1.0  # Assume available if returned by query

        # Calculate Multi-Factor Score: Score(ri) = α(1/di) + β(Ci) + γ(Si)
        total_score = (
            (alpha * d_factor)
            + (beta * capability_score)
            + (gamma * availability_score)
        )

        if total_score > max_score:
            max_score = total_score
            best_ambulance = amb
            best_distance = dist

    if best_ambulance:
        emergency.status = "ACCEPTED"
        emergency.accepted_by = str(best_ambulance.id)

        create_audit_block(
            "EMERGENCY_AUTO_DISPATCHED",
            {
                "emergency_id": emergency.id,
                "ambulance_id": best_ambulance.id,
                "score": max_score,
            },
        )

        db.session.commit()

        from backend.extensions import socketio

        socketio.emit(
            "emergency_accepted",
            {
                "emergency_id": emergency_id,
                "patient_id": emergency.patient_id,
                "role": "ambulance",
                "ambulance_id": best_ambulance.id,
            },
        )
        socketio.emit("refresh_emergencies", {})

        return (
            jsonify(
                {
                    "msg": "Ambulance auto-dispatched successfully using Multi-Factor Score",
                    "ambulance_id": best_ambulance.id,
                    "distance_km": round(best_distance, 2),
                    "score": round(max_score, 3),
                }
            ),
            200,
        )

    return jsonify({"msg": "No suitable ambulances found"}), 404
