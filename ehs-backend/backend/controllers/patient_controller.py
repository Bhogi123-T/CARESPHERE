from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import PatientProfile
from backend.models import PatientProfile
from backend.extensions import db, socketio
from datetime import datetime
import uuid
import random

patient_bp = Blueprint("patient_bp", __name__)

def calculate_ai_triage_score(medical_history, age):
    """
    Simulates a Machine Learning classification model (e.g., Random Forest or XGBoost).
    Returns a severity score from 0 to 100.
    """
    score = 10 # Base score
    
    history_lower = (medical_history or "").lower()
    
    # Age factor
    if age > 60:
        score += 30
    elif age > 40:
        score += 15
        
    # High risk conditions (Heavily weighted)
    high_risk_keywords = ["diabetes", "hypertension", "heart", "bp", "blood pressure", "asthma", "cancer", "stroke"]
    for word in high_risk_keywords:
        if word in history_lower:
            score += 25
            
    # Medium risk conditions
    medium_risk_keywords = ["thyroid", "anemia", "pcos", "fever", "pain"]
    for word in medium_risk_keywords:
        if word in history_lower:
            score += 10
            
    # Add a slight AI confidence variance (simulation)
    score += random.uniform(-5, 5)
    
    # Cap score at 100
    return min(100, max(0, score))

def calculate_pre_registration_risk(medical_history, age):
    score = calculate_ai_triage_score(medical_history, age)
    
    if score >= 60:
        return "High"
    elif score >= 30:
        return "Medium"
    else:
        return "Low"

@patient_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    
    profile = PatientProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({"msg": "Profile not found"}), 404
        
    return jsonify({
        "id": profile.id,
        "name": profile.name,
        "age": profile.age,
        "blood_group": profile.blood_group,
        "medical_history": profile.medical_history,
        "family_contact": profile.family_contact,
        "expected_delivery_date": profile.expected_delivery_date.isoformat() if profile.expected_delivery_date else None,
        "lat": profile.lat,
        "lng": profile.lng,
        "risk_level": profile.risk_level
    }), 200

@patient_bp.route("/profile", methods=["POST"])
@jwt_required()
def create_or_update_profile():
    user_id = get_jwt_identity()
    data = request.json
    
    name = data.get("name")
    age = data.get("age")
    blood_group = data.get("blood_group")
    medical_history = data.get("medical_history", "")
    family_contact = data.get("family_contact")
    lat = data.get("lat")
    lng = data.get("lng")
    
    expected_delivery_date = data.get("expected_delivery_date")
    if expected_delivery_date:
        try:
            # handle formats like YYYY-MM-DD
            expected_delivery_date = datetime.strptime(expected_delivery_date.split("T")[0], "%Y-%m-%d")
        except ValueError:
            expected_delivery_date = None
            
    risk_level = calculate_pre_registration_risk(medical_history, int(age) if age else 25)
    
    profile = PatientProfile.query.filter_by(user_id=user_id).first()
    if profile:
        # Update existing
        profile.name = name
        profile.age = age
        profile.blood_group = blood_group
        profile.medical_history = medical_history
        profile.family_contact = family_contact
        profile.lat = lat
        profile.lng = lng
        profile.expected_delivery_date = expected_delivery_date
        profile.risk_level = risk_level
    else:
        # Create new
        profile = PatientProfile(
            user_id=user_id,
            name=name,
            age=age,
            blood_group=blood_group,
            medical_history=medical_history,
            family_contact=family_contact,
            lat=lat,
            lng=lng,
            expected_delivery_date=expected_delivery_date,
            risk_level=risk_level
        )
        db.session.add(profile)
        
    db.session.commit()
    
    # Notify Ambulance and Hospital that a new patient registered
    socketio.emit('new_patient_registered', {
        'name': profile.name,
        'risk_level': profile.risk_level,
        'blood_group': profile.blood_group,
        'medical_history': profile.medical_history
    })
    
    return jsonify({"msg": "Profile saved successfully", "risk_level": risk_level}), 200

@patient_bp.route("/consultation", methods=["POST"])
@jwt_required()
def request_consultation():
    user_id = str(get_jwt_identity())
    
    from backend.models import Consultation
    
    # Generate a mock Jitsi meet link
    meet_id = str(uuid.uuid4())[:8]
    video_link = f"https://meet.jit.si/EHS-Consultation-{meet_id}"
    
    consult = Consultation(
        id=str(uuid.uuid4()),
        patient_id=user_id,
        status="REQUESTED",
        video_link=video_link
    )
    
    db.session.add(consult)
    db.session.commit()
    
    # Notify doctors/admins
    socketio.emit('new_consultation_request', {
        'consultation_id': consult.id,
        'patient_id': user_id,
        'video_link': video_link
    })
    
    return jsonify({
        "msg": "Consultation requested successfully",
        "consultation_id": consult.id,
        "video_link": video_link
    }), 201

import json

@patient_bp.route("/consultation/<consultation_id>/finish", methods=["POST"])
@jwt_required()
def finish_consultation(consultation_id):
    """
    Simulates AI NLP Transcription of a Telemedicine consultation.
    Takes a raw voice transcript and converts it into structured clinical notes.
    """
    data = request.json
    raw_transcript = data.get("transcript", "")
    
    from backend.models import Consultation
    consult = Consultation.query.get(consultation_id)
    if not consult:
        return jsonify({"msg": "Consultation not found"}), 404
        
    consult.status = "COMPLETED"
    consult.transcript = raw_transcript
    
    # Mock NLP processing logic
    transcript_lower = raw_transcript.lower()
    
    symptoms = []
    if "fever" in transcript_lower or "temperature" in transcript_lower:
        symptoms.append("Pyrexia (Fever)")
    if "pain" in transcript_lower:
        symptoms.append("Pain reported")
    if "cough" in transcript_lower:
        symptoms.append("Cough / Respiratory Distress")
        
    diagnosis = "Pending Lab Results"
    if "chest" in transcript_lower and "pain" in transcript_lower:
        diagnosis = "Suspected Angina / Myocardial Infarction"
    elif "venom" in transcript_lower or "snake" in transcript_lower:
        diagnosis = "Snakebite Envenomation"
        
    structured_notes = {
        "extracted_symptoms": symptoms if symptoms else ["No clear symptoms extracted"],
        "suspected_diagnosis": diagnosis,
        "recommended_action": "Follow up with primary care physician in 48 hours."
    }
    
    consult.notes = json.dumps(structured_notes)
    db.session.commit()
    
    # Audit log
    from utils.blockchain import create_audit_block
    create_audit_block("CONSULTATION_FINISHED", {
        "consultation_id": consult.id,
        "patient_id": consult.patient_id,
        "diagnosis": diagnosis
    })
    
    return jsonify({
        "msg": "Consultation completed and AI notes generated",
        "notes": structured_notes
    }), 200
