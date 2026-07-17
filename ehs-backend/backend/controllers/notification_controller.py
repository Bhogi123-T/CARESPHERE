from flask import Blueprint, jsonify
from backend.models import NotificationLog
from flask_jwt_extended import jwt_required, get_jwt_identity

notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/history', methods=['GET'])
@jwt_required()
def get_notification_history():
    identity = get_jwt_identity()
    contact_info = identity.get('contact_info')
    
    logs = NotificationLog.query.filter_by(recipient=contact_info).order_by(NotificationLog.created_at.desc()).all()
    
    return jsonify([{
        "id": log.id,
        "recipient": log.recipient,
        "message": log.message,
        "status": log.status,
        "created_at": log.created_at.isoformat() if log.created_at else None
    } for log in logs]), 200
