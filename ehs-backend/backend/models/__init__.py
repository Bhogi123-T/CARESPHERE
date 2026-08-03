from backend.extensions import db
from flask_login import UserMixin
from datetime import datetime


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    contact_info = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(255), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    profile_completed = db.Column(db.Boolean, default=False)

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)


class PatientProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    blood_group = db.Column(db.String(10), nullable=False)
    medical_history = db.Column(db.Text, nullable=True)
    family_contact = db.Column(db.String(20), nullable=False)
    expected_delivery_date = db.Column(db.DateTime, nullable=True)
    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)
    risk_level = db.Column(db.String(20), default="Low")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super(PatientProfile, self).__init__(**kwargs)


class Emergency(db.Model):
    id = db.Column(db.String(50), primary_key=True)  # UUID string
    patient_id = db.Column(db.String(50), nullable=False)
    symptoms = db.Column(db.Text, nullable=False)
    risk_level = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default="PENDING")
    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)
    location_name = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    accepted_by = db.Column(db.String(50), nullable=True)  # ambulance or hospital id
    volunteer_id = db.Column(
        db.String(50), nullable=True
    )  # separate volunteer responder
    is_moving = db.Column(db.Boolean, default=False)
    meeting_point_lat = db.Column(db.Float, nullable=True)
    meeting_point_lng = db.Column(db.Float, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    hospital_name = db.Column(db.String(100), nullable=True)
    hospital_lat = db.Column(db.Float, nullable=True)
    hospital_lng = db.Column(db.Float, nullable=True)

    def __init__(self, **kwargs):
        super(Emergency, self).__init__(**kwargs)


class Volunteer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    skills = db.Column(db.String(255), nullable=True)
    availability_status = db.Column(db.Boolean, default=True)
    rating = db.Column(db.Float, default=5.0)

    def __init__(self, **kwargs):
        super(Volunteer, self).__init__(**kwargs)


class Pharmacy(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    is_open_24_7 = db.Column(db.Boolean, default=False)
    inventory = db.Column(
        db.Text, nullable=True
    )  # JSON string of available critical medicines

    def __init__(self, **kwargs):
        super(Pharmacy, self).__init__(**kwargs)


class BloodDonor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    blood_group = db.Column(db.String(10), nullable=False)
    last_donation_date = db.Column(db.DateTime, nullable=True)
    is_available = db.Column(db.Boolean, default=True)

    def __init__(self, **kwargs):
        super(BloodDonor, self).__init__(**kwargs)


class BloodRequest(db.Model):
    id = db.Column(db.String(50), primary_key=True)  # UUID string
    patient_id = db.Column(db.String(50), nullable=False)
    blood_group = db.Column(db.String(10), nullable=False)
    units_needed = db.Column(db.Integer, default=1)
    status = db.Column(db.String(20), default="PENDING")
    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    accepted_by = db.Column(db.String(50), nullable=True)

    def __init__(self, **kwargs):
        super(BloodRequest, self).__init__(**kwargs)


class PharmacyInventory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pharmacy_id = db.Column(
        db.Integer, db.ForeignKey("user.id"), nullable=True
    )  # can be null for global mock
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    stock = db.Column(db.Integer, default=0)
    status = db.Column(
        db.String(20), default="OUT_OF_STOCK"
    )  # OPTIMAL, LOW, OUT_OF_STOCK

    def __init__(self, **kwargs):
        super(PharmacyInventory, self).__init__(**kwargs)


class HospitalResource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    total_beds = db.Column(db.Integer, default=0)
    available_beds = db.Column(db.Integer, default=0)
    icu_beds = db.Column(db.Integer, default=0)
    ventilators = db.Column(db.Integer, default=0)
    last_updated = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __init__(self, **kwargs):
        super(HospitalResource, self).__init__(**kwargs)


class NotificationLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    recipient = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default="SENT")  # SENT, DELIVERED, FAILED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super(NotificationLog, self).__init__(**kwargs)


class Consultation(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    patient_id = db.Column(db.String(50), nullable=False)
    doctor_id = db.Column(db.String(50), nullable=True)
    status = db.Column(
        db.String(20), default="REQUESTED"
    )  # REQUESTED, ACTIVE, COMPLETED
    video_link = db.Column(db.String(255), nullable=True)
    transcript = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)  # JSON string of structured notes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super(Consultation, self).__init__(**kwargs)


class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    emergency_id = db.Column(
        db.String(50), db.ForeignKey("emergency.id"), nullable=False
    )
    sender_role = db.Column(
        db.String(20), nullable=False
    )  # patient, ambulance, hospital
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super(ChatMessage, self).__init__(**kwargs)


class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text, nullable=True)
    previous_hash = db.Column(db.String(64), nullable=False)
    block_hash = db.Column(db.String(64), nullable=False, unique=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super(AuditLog, self).__init__(**kwargs)
