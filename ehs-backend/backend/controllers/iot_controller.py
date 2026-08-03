from flask import Blueprint, request, jsonify
from backend.models import Emergency
from backend.extensions import db, socketio
import uuid

iot_bp = Blueprint("iot_bp", __name__)


@iot_bp.route("/trigger", methods=["POST"])
def trigger_iot_emergency():
    """
    Accepts raw data from IoT devices like a Crash Telematics Sensor or Wearable Panic Button.
    """
    data = request.json
    device_id = data.get("device_id", "unknown")
    lat = data.get("lat")
    lng = data.get("lng")
    sensor_type = data.get("sensor_type", "panic_button")  # crash_sensor, panic_button
    sensor_data = data.get("sensor_data", {})

    patient_id = data.get("patient_id", f"IoT_{device_id}")

    symptoms = f"IoT Auto-Trigger: {sensor_type}. "
    if sensor_type == "crash_sensor":
        symptoms += f"Impact force: {sensor_data.get('g_force', 'Unknown')}G. "
    elif sensor_type == "panic_button":
        symptoms += f"Heart rate: {sensor_data.get('heart_rate', 'Unknown')} bpm. "

    emergency = Emergency(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        symptoms=symptoms,
        risk_level="CRITICAL",
        lat=lat,
        lng=lng,
        location_name="Auto-detected via GPS",
        status="PENDING",
    )

    db.session.add(emergency)
    db.session.commit()

    # Alert the entire network instantly
    socketio.emit(
        "new_emergency_alert",
        {
            "id": emergency.id,
            "risk_level": emergency.risk_level,
            "symptoms": emergency.symptoms,
            "is_iot": True,
        },
    )

    # Tell clients to refresh their lists
    socketio.emit("refresh_emergencies", {})

    return (
        jsonify(
            {
                "msg": "IoT Emergency Triggered Successfully",
                "emergency_id": emergency.id,
            }
        ),
        201,
    )
