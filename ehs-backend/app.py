import os
import uuid

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_socketio import join_room
from werkzeug.security import check_password_hash, generate_password_hash

from backend.controllers.analytics_controller import analytics_bp
from backend.controllers.drone_controller import drone_bp
from backend.controllers.emergency_controller import emergency_bp
from backend.controllers.hospital_controller import hospital_bp
from backend.controllers.agent_controller import agent_bp
from backend.controllers.iot_controller import iot_bp
from backend.controllers.ml_controller import ml_bp
from backend.controllers.notification_controller import notification_bp
from backend.controllers.patient_controller import patient_bp
from backend.controllers.pharmacy_controller import pharmacy_bp
from backend.controllers.risk_controller import risk_bp
from backend.controllers.smart_city_controller import smart_city_bp
from backend.controllers.audit_controller import audit_bp
from backend.extensions import db, socketio
from backend.models import BloodRequest, ChatMessage, Emergency, PatientProfile, User
from utils.blockchain import create_audit_block
from utils.notifications import NotificationService
from backend.ml.realtime_inference import analyze_vitals_stream

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "fallback_secret_key_if_missing")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "fallback_jwt_secret")


# Supabase Postgres connection or local SQLite fallback
database_url = os.getenv("DATABASE_URL", "sqlite:///ehs.db")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app)

# Initialize Extensions
db.init_app(app)
socketio.init_app(app)
jwt = JWTManager(app)

# Register Blueprints
app.register_blueprint(agent_bp, url_prefix="/api/agent")
app.register_blueprint(risk_bp, url_prefix="/api")
app.register_blueprint(emergency_bp, url_prefix="/api")
app.register_blueprint(patient_bp, url_prefix="/api/patient")
app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
app.register_blueprint(pharmacy_bp, url_prefix="/api/pharmacy")
app.register_blueprint(ml_bp, url_prefix="/api/ml")
app.register_blueprint(drone_bp, url_prefix="/api/drone")
app.register_blueprint(hospital_bp, url_prefix="/api/hospital")
app.register_blueprint(notification_bp, url_prefix="/api/notification")
app.register_blueprint(smart_city_bp, url_prefix="/api/smart-city")
app.register_blueprint(iot_bp, url_prefix="/api/iot")
app.register_blueprint(audit_bp, url_prefix="/api/audit")

from backend.controllers.abdm_controller import abdm_bp

app.register_blueprint(abdm_bp, url_prefix="/api/abdm")

# --- Error Handlers ---


@app.errorhandler(Exception)
def handle_exception(e):
    # Log the error (in production, use a proper logger)
    print(f"Global Error: {e}")
    # Return a generic JSON response
    return (
        jsonify(
            {
                "error": "Internal Server Error",
                "message": (
                    str(e) if app.config["DEBUG"] else "An unexpected error occurred."
                ),
            }
        ),
        500,
    )


@app.errorhandler(404)
def not_found(e):
    return (
        jsonify(
            {"error": "Not Found", "message": "The requested resource was not found."}
        ),
        404,
    )


# --- Authentication API Routes ---


@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json
    contact_info = data.get("contact_info")
    password = data.get("password")
    role = data.get("role", "patient")

    if User.query.filter_by(contact_info=contact_info).first():
        return jsonify({"msg": "User already exists"}), 400

    # Hash the password
    hashed_password = generate_password_hash(password)
    new_user = User(contact_info=contact_info, password=hashed_password, role=role)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "User created successfully"}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    contact_info = data.get("contact_info")
    password = data.get("password")

    user = User.query.filter_by(contact_info=contact_info).first()

    if not user:
        return jsonify({"msg": "Invalid credentials"}), 401

    # For legacy users with unhashed passwords (fallback)
    if (
        not user.password.startswith("scrypt:")
        and not user.password.startswith("pbkdf2:")
        and user.password == password
    ):
        # Transparently upgrade their password hash
        user.password = generate_password_hash(password)
        db.session.commit()
    elif not check_password_hash(user.password, password):
        return jsonify({"msg": "Invalid credentials"}), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "contact_info": user.contact_info},
    )
    return jsonify(
        access_token=access_token,
        user={
            "id": user.id, 
            "role": user.role, 
            "contact_info": user.contact_info,
            "name": user.name,
            "address": user.address,
            "profile_completed": user.profile_completed
        },
    )

@app.route("/api/auth/profile", methods=["POST"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    data = request.json
    user.name = data.get("name")
    user.address = data.get("address")
    user.profile_completed = True
    
    db.session.commit()
    
    return jsonify({
        "msg": "Profile updated successfully",
        "user": {
            "id": user.id,
            "role": user.role,
            "contact_info": user.contact_info,
            "name": user.name,
            "address": user.address,
            "profile_completed": user.profile_completed
        }
    }), 200

@app.route("/api/patient/profile", methods=["GET"])
@jwt_required()
def get_patient_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    profile = PatientProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        # If no profile exists yet, return some defaults so the frontend doesn't crash
        # or we could return 404 and let the frontend handle it.
        # Returning a dummy profile for the MVP:
        return jsonify({
            "id": "mock_id",
            "name": user.name or "Unknown",
            "age": 30,
            "blood_group": "Unknown",
            "medical_history": "None",
            "family_contact": "9999999999",
            "expected_delivery_date": None,
            "risk_level": "Low"
        }), 200
        
    return jsonify({
        "id": profile.id,
        "name": profile.name,
        "age": profile.age,
        "blood_group": profile.blood_group,
        "medical_history": profile.medical_history,
        "family_contact": profile.family_contact,
        "expected_delivery_date": profile.expected_delivery_date.isoformat() if profile.expected_delivery_date else None,
        "risk_level": profile.risk_level
    }), 200

@app.route("/api/abdm/fetch-profile", methods=["POST"])
@jwt_required(optional=True)
def abdm_fetch_profile():
    data = request.json
    abha_id = data.get("abha_id")
    
    if not abha_id or len(abha_id.replace('-', '')) != 14:
        return jsonify({"msg": "Invalid ABHA ID"}), 400
        
    return jsonify({
        "msg": "Success",
        "data": {
            "blood_group": "O+",
            "medical_history": "Hypertension diagnosed 2021",
            "allergies": "Penicillin, Peanuts",
            "past_surgeries": "Appendectomy (2018)"
        }
    }), 200


# --- SocketIO Events ---


@socketio.on("new_emergency")
def handle_new_emergency(data):
    # Handle case where location is null or denied
    loc_data = data.get("location") or {}
    
    # Save to database
    emergency = Emergency(
        id=str(uuid.uuid4()),
        patient_id=data.get("patient_id"),
        symptoms=data.get("symptoms"),
        risk_level=data.get("risk_level"),
        lat=loc_data.get("lat"),
        lng=loc_data.get("lng"),
        location_name=data.get("locationName"),
        status="PENDING",
    )
    with app.app_context():
        db.session.add(emergency)
        db.session.commit()

        # Access attributes before they might expire, or just use the data dict
        e_id = emergency.id
        e_patient_id = data.get("patient_id")
        e_risk_level = data.get("risk_level")
        e_lat = loc_data.get("lat")
        e_lng = loc_data.get("lng")
        e_location_name = data.get("locationName")
        e_symptoms = data.get("symptoms")

        create_audit_block(
            "EMERGENCY_CREATED",
            {
                "emergency_id": e_id,
                "patient_id": e_patient_id,
                "risk_level": e_risk_level,
            },
        )

        # Phase 3: Simultaneous Alerts Simulation
        patient_profile = PatientProfile.query.filter_by(user_id=e_patient_id).first()
        family_contact = (
            patient_profile.family_contact if patient_profile else "UNKNOWN"
        )
        patient_name = patient_profile.name if patient_profile else "Patient"

        google_maps_link = f"https://maps.google.com/?q={e_lat},{e_lng}"
        print("=" * 50)
        print("SIMULTANEOUS ALERTS DISPATCHED")

        if e_symptoms and "Vet Emergency" in e_symptoms:
            NotificationService.send_sms(
                "HOSPITAL_NUMBER",
                f"VETERINARY MOBILE UNIT: Dispatch to {e_location_name}",
            )
            NotificationService.send_sms(
                "VOLUNTEER_NUMBER",
                f"LOCAL ASHA/VOLUNTEERS: Requested assistance at {e_location_name}",
            )
            NotificationService.send_sms(
                family_contact,
                f"FAMILY: {patient_name} reported a Livestock Emergency! Track here: {google_maps_link}",
            )
        elif e_symptoms and "Pesticide" in e_symptoms:
            NotificationService.send_sms(
                "108",
                f"AMBULANCE (108): Dispatch to {e_location_name} (Priority: POISONING)",
            )
            NotificationService.send_sms(
                "HOSPITAL_NUMBER",
                f"HOSPITAL: Pre-arrival alert for POISON CONTROL - {e_symptoms}",
            )
            NotificationService.send_sms(
                family_contact,
                f"FAMILY: {patient_name} has a {e_risk_level} emergency! Track here: {google_maps_link}",
            )
        else:
            NotificationService.send_sms(
                "108", f"AMBULANCE (108): Dispatch to {e_location_name}"
            )
            NotificationService.send_sms(
                "HOSPITAL_NUMBER",
                f"HOSPITAL: Pre-arrival alert for {e_symptoms}",
            )
            NotificationService.send_sms(
                family_contact,
                f"FAMILY: {patient_name} has a {e_risk_level} emergency! Track here: {google_maps_link}",
            )
            NotificationService.send_sms(
                "VOLUNTEER_NUMBER",
                f"VOLUNTEERS: Requesting First-Aid near {e_location_name}",
            )

        print("=" * 50)

    # Send specific alert for toast notifications
    socketio.emit(
        "new_emergency_alert",
        {
            "id": e_id,
            "risk_level": e_risk_level,
            "symptoms": e_symptoms,
            "locationName": e_location_name,
        },
    )

    # Broadcast to all connected clients (specifically hospitals/ambulances)
    broadcast_emergencies()


@socketio.on("accept_emergency")
def handle_accept_emergency(data):
    emergency_id = data.get("emergency_id")
    role = data.get("role")

    with app.app_context():
        emergency = Emergency.query.get(emergency_id)
        if emergency:
            if role == "volunteer":
                emergency.volunteer_id = data.get(
                    "donor_id", "volunteer_1"
                )  # Add volunteer ID
                # If volunteer accepts, they just join, they don't block
                # ambulance
            elif emergency.status == "PENDING":
                emergency.status = "ACCEPTED"
                emergency.accepted_by = role

                if role == "ambulance":
                    # Auto-assign a nearby mock hospital
                    emergency.hospital_name = "Apollo City Hospital"
                    # Offset slightly from emergency for demo
                    emergency.hospital_lat = (emergency.lat or 17.3850) + 0.015
                    emergency.hospital_lng = (emergency.lng or 78.4867) + 0.015

            db.session.commit()

            create_audit_block(
                "EMERGENCY_ACCEPTED",
                {
                    "emergency_id": emergency.id,
                    "accepted_by": role,
                    "volunteer_id": emergency.volunteer_id,
                },
            )

            # Notify the patient that their request was accepted (Online)
            socketio.emit(
                "emergency_accepted",
                {
                    "emergency_id": emergency_id,
                    "patient_id": emergency.patient_id,
                    "role": role,
                },
            )
            
            # PHASE 3: Offline Notification - Send SMS back to the Patient!
            # If the patient has no network, they won't get the socket event. 
            # We must SMS them to confirm help is coming.
            patient_user = User.query.get(emergency.patient_id)
            if patient_user and patient_user.contact_info:
                NotificationService.send_sms(
                    patient_user.contact_info,
                    f"AMBULANCE EN ROUTE: Help is on the way! The {role} has accepted your SOS and is coming to your location."
                )

            # Update everyone's dashboard
            broadcast_emergencies()


@socketio.on("update_moving_status")
def handle_update_moving_status(data):
    emergency_id = data.get("emergency_id")
    is_moving = data.get("is_moving")

    with app.app_context():
        emergency = Emergency.query.get(emergency_id)
        if emergency:
            emergency.is_moving = is_moving
            if is_moving:
                # Simulate a halfway point (shifting slightly towards center coordinates)
                # For demo purposes, we just offset the lat/lng slightly
                emergency.meeting_point_lat = (emergency.lat or 17.3850) + 0.015
                emergency.meeting_point_lng = (emergency.lng or 78.4867) + 0.015

            db.session.commit()

            socketio.emit(
                "smart_route_updated",
                {
                    "emergency_id": emergency.id,
                    "is_moving": is_moving,
                    "meeting_point_lat": emergency.meeting_point_lat,
                    "meeting_point_lng": emergency.meeting_point_lng,
                },
            )


@socketio.on("ambulance_location_update")
def handle_ambulance_location_update(data):
    # data expects: emergency_id, lat, lng, distance_left, eta_left
    # Broadcast directly to all clients (Hospital and Patient dashboards)
    socketio.emit("live_ambulance_location", data)


@socketio.on("request_emergencies")
def handle_request_emergencies():
    broadcast_emergencies()


def broadcast_emergencies():
    with app.app_context():
        emergencies = Emergency.query.filter(
            Emergency.status.in_(["PENDING", "ACCEPTED"])
        ).all()
        data = []
        for e in emergencies:
            profile = PatientProfile.query.filter_by(user_id=e.patient_id).first()
            data.append(
                {
                    "id": e.id,
                    "patient_id": e.patient_id,
                    "symptoms": e.symptoms,
                    "risk_level": e.risk_level,
                    "status": e.status,
                    "location_name": e.location_name,
                    "location": {"lat": e.lat, "lng": e.lng} if e.lat else None,
                    "patient_name": profile.name if profile else "Unknown Patient",
                    "patient_age": profile.age if profile else "N/A",
                    "blood_group": profile.blood_group if profile else "Unknown",
                    "medical_history": (
                        profile.medical_history if profile else "No history provided."
                    ),
                    "hospital_name": e.hospital_name,
                    "hospital_location": (
                        {"lat": e.hospital_lat, "lng": e.hospital_lng}
                        if e.hospital_lat
                        else None
                    ),
                    "created_at": e.created_at.isoformat() if e.created_at else None,
                }
            )
        socketio.emit("update_emergencies", data)


# --- Advanced Real-Time Features ---


@socketio.on("join_emergency_room")
def handle_join_room(data):
    emergency_id = data.get("emergency_id")
    if emergency_id:
        join_room(emergency_id)
        socketio.emit(
            "room_notification",
            {"msg": f"Someone joined {emergency_id}"},
            to=emergency_id,
        )


@socketio.on("send_message")
def handle_send_message(data):
    emergency_id = data.get("emergency_id")
    sender_role = data.get("sender_role")
    message_text = data.get("message")

    if emergency_id and message_text:
        with app.app_context():
            chat_msg = ChatMessage(
                emergency_id=emergency_id,
                sender_role=sender_role or "unknown",
                message=message_text,
            )
            db.session.add(chat_msg)
            db.session.commit()

            socketio.emit(
                "receive_message",
                {
                    "id": chat_msg.id,
                    "emergency_id": chat_msg.emergency_id,
                    "sender_role": chat_msg.sender_role,
                    "message": chat_msg.message,
                    "timestamp": chat_msg.timestamp.isoformat(),
                },
                to=emergency_id,
            )


@socketio.on("stream_vitals")
def handle_stream_vitals(data):
    emergency_id = data.get("emergency_id")
    # data expects: heart_rate, blood_pressure, spo2
    if emergency_id:
        # Run real-time ML inference
        analysis_result = analyze_vitals_stream(data)

        # Broadcast the vitals update
        socketio.emit("vitals_update", data, to=emergency_id)

        # Broadcast the real-time AI risk/anomaly update
        socketio.emit("realtime_risk_update", analysis_result, to=emergency_id)

        # If an anomaly is detected, emit a specific high-priority alert
        if analysis_result.get("is_anomaly"):
            socketio.emit("ml_anomaly_alert", analysis_result, to=emergency_id)


# --- AR/VR Remote Surgery Haptics ---
@socketio.on("haptic_stream")
def handle_haptic_stream(data):
    """
    Simulates a 5G ultra-low latency WebSocket stream for AR/VR remote surgery.
    Rebroadcasts robotic haptic commands from a specialist to the paramedic.
    """
    emergency_id = data.get("emergency_id")
    if emergency_id:
        # High frequency broadcast to the emergency room
        socketio.emit("haptic_command_received", data, to=emergency_id)


# --- Blood Request SocketIO Events ---


@socketio.on("new_blood_request")
def handle_new_blood_request(data):
    blood_req = BloodRequest(
        id=str(uuid.uuid4()),
        patient_id=data.get("patient_id", "Unknown"),
        blood_group=data.get("blood_group"),
        units_needed=data.get("units_needed", 1),
        lat=data.get("location", {}).get("lat"),
        lng=data.get("location", {}).get("lng"),
        status="PENDING",
    )
    with app.app_context():
        db.session.add(blood_req)
        db.session.commit()

    # Toast alert for donors
    socketio.emit(
        "new_blood_alert",
        {
            "id": blood_req.id,
            "blood_group": blood_req.blood_group,
            "units": blood_req.units_needed,
        },
    )
    broadcast_blood_requests()


@socketio.on("accept_blood_request")
def handle_accept_blood_request(data):
    req_id = data.get("request_id")
    donor_id = data.get("donor_id")

    with app.app_context():
        blood_req = BloodRequest.query.get(req_id)
        if blood_req and blood_req.status == "PENDING":
            blood_req.status = "ACCEPTED"
            blood_req.accepted_by = donor_id
            db.session.commit()

            broadcast_blood_requests()


@socketio.on("request_blood_requests")
def handle_request_blood_requests():
    broadcast_blood_requests()


def broadcast_blood_requests():
    with app.app_context():
        requests = BloodRequest.query.filter(
            BloodRequest.status.in_(["PENDING", "ACCEPTED"])
        ).all()
        data = [
            {
                "id": r.id,
                "patient_id": r.patient_id,
                "blood_group": r.blood_group,
                "units_needed": r.units_needed,
                "status": r.status,
                "location": {"lat": r.lat, "lng": r.lng} if r.lat else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in requests
        ]
        socketio.emit("update_blood_requests", data)


# Ensure database tables exist if not using Flask-Migrate yet
# For real-world, you should use 'flask db upgrade' instead of create_all
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    # Use eventlet or gunicorn in production
    socketio.run(
        app,
        host="0.0.0.0",
        debug=os.getenv("FLASK_DEBUG", "False") == "True",
        use_reloader=False,
        port=int(os.getenv("PORT", 5000)),
        allow_unsafe_werkzeug=True,  # type: ignore
    )
