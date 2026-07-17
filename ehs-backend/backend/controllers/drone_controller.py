from flask import Blueprint, request, jsonify
from utils.geo import haversine_distance
from backend.extensions import socketio
import random

drone_bp = Blueprint('drone_bp', __name__)

@drone_bp.route('/request', methods=['POST'])
def request_drone():
    """
    Simulates requesting an autonomous medical drone for critical payload delivery.
    """
    data = request.json
    patient_lat = data.get('lat')
    patient_lng = data.get('lng')
    payload_type = data.get('payload_type', 'Blood') # e.g. Anti-Venom, O- Blood
    
    if not patient_lat or not patient_lng:
        return jsonify({"msg": "Patient coordinates required"}), 400
        
    # Mocking nearest blood bank/hospital coordinates
    origin_lat = float(patient_lat) + random.uniform(-0.1, 0.1)
    origin_lng = float(patient_lng) + random.uniform(-0.1, 0.1)
    
    distance = haversine_distance(origin_lat, origin_lng, patient_lat, patient_lng)
    
    # Drone mock specs: Speed 80 km/h
    speed_kmh = 80
    time_hours = distance / speed_kmh
    time_minutes = int(time_hours * 60)
    
    # Wind resistance penalty mock
    wind_penalty = random.randint(0, 5)
    eta = max(1, time_minutes + wind_penalty)
    
    drone_id = f"DRN-{random.randint(1000, 9999)}"
    
    # Emit drone dispatch event to UI
    socketio.emit('drone_dispatched', {
        "drone_id": drone_id,
        "payload_type": payload_type,
        "eta_minutes": eta,
        "distance_km": round(distance, 2),
        "origin": {"lat": origin_lat, "lng": origin_lng},
        "destination": {"lat": patient_lat, "lng": patient_lng}
    })
    
    return jsonify({
        "msg": f"Drone {drone_id} dispatched successfully",
        "drone_id": drone_id,
        "eta_minutes": eta,
        "distance_km": round(distance, 2)
    }), 201
