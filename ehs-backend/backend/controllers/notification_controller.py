from flask import Blueprint, jsonify, request
from backend.models import NotificationLog, Emergency, User
from backend.extensions import db, socketio
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

notification_bp = Blueprint("notification", __name__)


@notification_bp.route("/sms-webhook", methods=["POST"])
def sms_webhook():
    """
    Webhook endpoint for receiving offline SMS from Twilio.
    Expected SMS Body format: "SOS, Lat, Lng, Symptoms"
    Example: "SOS, 17.3850, 78.4867, Severe chest pain and breathing issues"
    """
    incoming_msg = request.values.get("Body", "").strip()
    sender_number = request.values.get("From", "").strip()

    logger.info(f"Received offline SMS from {sender_number}: {incoming_msg}")

    if not incoming_msg.lower().startswith("sos"):
        # Not a valid emergency format, ignore or respond with error message
        return "<Response></Response>", 200

    try:
        # Parse: SOS, Lat, Lng, Symptoms
        parts = incoming_msg.split(",", 3)
        if len(parts) >= 3:
            lat = float(parts[1].strip())
            lng = float(parts[2].strip())
            symptoms = parts[3].strip() if len(parts) == 4 else "Unknown"

            # Identify user by phone number
            user = User.query.filter_by(contact_info=sender_number).first()
            patient_id = user.id if user else "UNKNOWN_SMS_USER"

            # Create emergency
            new_emergency = Emergency(
                patient_id=patient_id,
                symptoms=symptoms,
                lat=lat,
                lng=lng,
                risk_level="HIGH",  # Defaulting to high for offline SMS until BERT processes it
                status="PENDING",
                created_at=datetime.utcnow(),
            )

            db.session.add(new_emergency)
            db.session.commit()

            # Trigger dispatch engine via socket
            socketio.emit(
                "new_emergency",
                {
                    "id": new_emergency.id,
                    "patient_id": patient_id,
                    "symptoms": symptoms,
                    "lat": lat,
                    "lng": lng,
                    "risk_level": "HIGH",
                    "status": "PENDING",
                    "source": "SMS_FALLBACK",
                },
            )

            # Respond to Twilio
            return (
                "<Response><Message>Emergency SOS received via SMS fallback. Help is on the way.</Message></Response>",
                200,
            )

    except Exception as e:
        logger.error(f"Error parsing offline SMS: {e}")
        return (
            "<Response><Message>Error processing SOS. Please try calling 108 directly.</Message></Response>",
            200,
        )


@notification_bp.route("/history", methods=["GET"])
@jwt_required()
def get_notification_history():
    identity = get_jwt_identity()
    contact_info = identity.get("contact_info")

    logs = (
        NotificationLog.query.filter_by(recipient=contact_info)
        .order_by(NotificationLog.created_at.desc())
        .all()
    )

    return (
        jsonify(
            [
                {
                    "id": log.id,
                    "recipient": log.recipient,
                    "message": log.message,
                    "status": log.status,
                    "created_at": (
                        log.created_at.isoformat() if log.created_at else None
                    ),
                }
                for log in logs
            ]
        ),
        200,
    )
