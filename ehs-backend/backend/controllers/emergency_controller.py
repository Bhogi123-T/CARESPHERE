from flask import Blueprint, request, jsonify
from backend.models import Emergency

emergency_bp = Blueprint("emergency_bp", __name__)

@emergency_bp.route("/emergencies", methods=["GET"])
def get_emergencies_list():
    # Return all emergencies from SQLite database
    emergencies = Emergency.query.all()
    records = [{
        'id': e.id,
        'patient_id': e.patient_id,
        'symptoms': e.symptoms,
        'risk_level': e.risk_level,
        'status': e.status,
        'location': {'lat': e.lat, 'lng': e.lng} if e.lat else None,
        'created_at': e.created_at.isoformat() if e.created_at else None
    } for e in emergencies]
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
    
    return jsonify({"msg": "Rating submitted successfully", "new_rating": volunteer.rating}), 200

from utils.geo import haversine_distance
from backend.models import User
import random

@emergency_bp.route("/auto-dispatch", methods=["POST"])
def auto_dispatch():
    data = request.json
    emergency_id = data.get("emergency_id")
    
    emergency = Emergency.query.get(emergency_id)
    if not emergency or emergency.status != 'PENDING':
        return jsonify({"msg": "Valid pending emergency not found"}), 404
        
    # Fetch active ambulances (Mocking active ambulances for demo)
    ambulances = User.query.filter_by(role='ambulance').all()
    
    closest_ambulance = None
    min_distance = float('inf')
    
    for amb in ambulances:
        # Mocking ambulance locations randomly around the city for demo
        amb_lat = (emergency.lat or 17.3850) + random.uniform(-0.1, 0.1)
        amb_lng = (emergency.lng or 78.4867) + random.uniform(-0.1, 0.1)
        
        dist = haversine_distance(emergency.lat, emergency.lng, amb_lat, amb_lng)
        if dist < min_distance:
            min_distance = dist
            closest_ambulance = amb
            
    if closest_ambulance:
        emergency.status = 'ACCEPTED'
        emergency.accepted_by = str(closest_ambulance.id)
        db.session.commit()
        
        from backend.extensions import socketio
        socketio.emit('emergency_accepted', {
            'emergency_id': emergency_id,
            'patient_id': emergency.patient_id,
            'role': 'ambulance', # Ensure it's treated as ambulance in UI
            'ambulance_id': closest_ambulance.id
        })
        socketio.emit('refresh_emergencies', {})
        
        return jsonify({
            "msg": "Ambulance auto-dispatched successfully",
            "ambulance_id": closest_ambulance.id,
            "distance_km": round(min_distance, 2)
        }), 200
        
    return jsonify({"msg": "No ambulances available"}), 404
