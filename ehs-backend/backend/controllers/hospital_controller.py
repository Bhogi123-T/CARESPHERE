from flask import Blueprint, request, jsonify
from backend.models import HospitalResource
from backend.extensions import db, socketio
from flask_jwt_extended import jwt_required, get_jwt_identity

hospital_bp = Blueprint('hospital', __name__)

@hospital_bp.route('/resources', methods=['GET'])
@jwt_required()
def get_resources():
    hospital_id = get_jwt_identity()
    resource = HospitalResource.query.filter_by(hospital_id=hospital_id).first()
    
    if not resource:
        return jsonify({"msg": "Resources not found"}), 404
        
    return jsonify({
        "total_beds": resource.total_beds,
        "available_beds": resource.available_beds,
        "icu_beds": resource.icu_beds,
        "ventilators": resource.ventilators,
        "last_updated": resource.last_updated.isoformat() if resource.last_updated else None
    }), 200

@hospital_bp.route('/resources', methods=['POST', 'PUT'])
@jwt_required()
def update_resources():
    hospital_id = get_jwt_identity()
    
    data = request.json
    resource = HospitalResource.query.filter_by(hospital_id=hospital_id).first()
    
    if not resource:
        resource = HospitalResource(hospital_id=hospital_id)
        db.session.add(resource)
        
    if 'total_beds' in data:
        resource.total_beds = data['total_beds']
    if 'available_beds' in data:
        resource.available_beds = data['available_beds']
    if 'icu_beds' in data:
        resource.icu_beds = data['icu_beds']
    if 'ventilators' in data:
        resource.ventilators = data['ventilators']
        
    db.session.commit()
    
    socketio.emit('hospital_capacity_updated', {
        'hospital_id': hospital_id,
        'available_beds': resource.available_beds,
        'icu_beds': resource.icu_beds,
        'ventilators': resource.ventilators
    })
    
    return jsonify({"msg": "Resources updated successfully"}), 200
