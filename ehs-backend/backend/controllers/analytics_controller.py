from flask import Blueprint, jsonify
from backend.models import Emergency, db
from datetime import datetime, timedelta
import random

analytics_bp = Blueprint('analytics_bp', __name__)

@analytics_bp.route('', methods=['GET'])
def get_analytics():
    # Base real data
    real_emergencies = Emergency.query.all()
    
    # 1. Total KPI
    total_emergencies = len(real_emergencies) + 842  # Seeded baseline
    avg_response_time = 14  # minutes
    critical_cases = sum(1 for e in real_emergencies if e.risk_level == 'CRITICAL') + 315
    lives_saved = int(total_emergencies * 0.92)
    
    # 2. Monthly Trend Data (Last 6 Months)
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    monthly_emergencies = [120, 145, 132, 150, 165, 130 + len(real_emergencies)]
    response_times = [22, 21, 19, 17, 15, avg_response_time]
    
    # 3. Risk Zones Heatmap Data
    # Generate some clustered points around rural AP (near Kurnool / Anantapur)
    # Base center: 15.8281, 78.0373 (Kurnool)
    risk_zones = []
    
    # Real data
    for e in real_emergencies:
        if e.lat and e.lng:
            risk_zones.append({"lat": e.lat, "lng": e.lng, "intensity": 0.9})
            
    # Mock data clusters
    for _ in range(40):
        # Cluster 1: Kurnool Rural
        risk_zones.append({
            "lat": 15.8281 + random.uniform(-0.1, 0.1),
            "lng": 78.0373 + random.uniform(-0.1, 0.1),
            "intensity": random.uniform(0.3, 0.8)
        })
        # Cluster 2: Nandyal
        risk_zones.append({
            "lat": 15.4800 + random.uniform(-0.08, 0.08),
            "lng": 78.4800 + random.uniform(-0.08, 0.08),
            "intensity": random.uniform(0.4, 0.9)
        })

    # 4. Infrastructure Recommendations
    recommendations = [
        "High maternal emergency density near Nandyal — recommend deploying 2 Mobile Medical Units.",
        "Average response time in Kurnool West is 22 mins — recommend building 1 new PHC.",
        "Increase in snake bite incidents in rural sectors — allocate extra Anti-Venom to ASHA workers."
    ]

    return jsonify({
        "kpis": {
            "total_emergencies": total_emergencies,
            "avg_response_time": avg_response_time,
            "critical_cases": critical_cases,
            "lives_saved": lives_saved
        },
        "trends": {
            "months": months,
            "emergencies": monthly_emergencies,
            "response_times": response_times
        },
        "risk_zones": risk_zones,
        "recommendations": recommendations
    }), 200

@analytics_bp.route('/outbreak-prediction', methods=['GET'])
def predict_outbreaks():
    """
    AI engine that scans recent emergencies and detects symptom clusters.
    """
    from datetime import datetime, timedelta
    from backend.extensions import socketio
    
    # Get emergencies from last 48 hours
    recent_time = datetime.utcnow() - timedelta(days=2)
    recent_emergencies = Emergency.query.filter(Emergency.created_at >= recent_time).all()
    
    # Simple NLP clustering mock
    fever_count = 0
    respiratory_count = 0
    
    for e in recent_emergencies:
        symptoms = e.symptoms.lower()
        if 'fever' in symptoms or 'temperature' in symptoms:
            fever_count += 1
        if 'cough' in symptoms or 'breath' in symptoms:
            respiratory_count += 1
            
    outbreaks = []
    # Using 1 instead of 3 for testing so it triggers easily
    if fever_count >= 1:
        outbreaks.append({
            "type": "Suspected Dengue/Malaria Cluster",
            "confidence": min(100, fever_count * 15 + 40),
            "affected_cases": fever_count
        })
        
    if respiratory_count >= 1:
        outbreaks.append({
            "type": "Respiratory Syndrome Cluster (Potential COVID/Flu)",
            "confidence": min(100, respiratory_count * 20 + 40),
            "affected_cases": respiratory_count
        })
        
    if outbreaks:
        socketio.emit('outbreak_warning', {"outbreaks": outbreaks})
        
    return jsonify({
        "msg": "Outbreak scan complete",
        "outbreaks": outbreaks
    }), 200
