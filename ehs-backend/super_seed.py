import os
import uuid
import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from app import app
from backend.extensions import db
from backend.models import (
    User, PatientProfile, Emergency, Volunteer, Pharmacy, BloodDonor,
    BloodRequest, PharmacyInventory, HospitalResource, NotificationLog, AuditLog
)
from utils.blockchain import create_audit_block

def super_seed():
    with app.app_context():
        # Clear existing data (optional, but good for a fresh start)
        db.drop_all()
        db.create_all()
        
        print("Starting Super Seed...")

        # 1. Create Base Users
        print("Creating Users...")
        roles = ["patient", "hospital", "ambulance", "volunteer", "pharmacy", "government"]
        users = []
        for i in range(1, 201):  # 200 users
            role = random.choices(roles, weights=[60, 10, 10, 10, 5, 5])[0]
            contact = f"99999{str(i).zfill(5)}"
            user = User(
                contact_info=contact,
                password=generate_password_hash("password123"),
                role=role
            )
            users.append(user)
        
        db.session.add_all(users)
        db.session.commit()

        # 2. Create Profiles for Patients
        print("Creating Patient Profiles...")
        patients = User.query.filter_by(role="patient").all()
        blood_groups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
        for p in patients:
            profile = PatientProfile(
                user_id=p.id,
                name=f"Patient {p.id}",
                age=random.randint(18, 80),
                blood_group=random.choice(blood_groups),
                medical_history=random.choice(["None", "Diabetes", "Hypertension", "Asthma", "Cardiac"]),
                family_contact=f"88888{str(p.id).zfill(5)}",
                lat=17.3850 + random.uniform(-0.1, 0.1),
                lng=78.4867 + random.uniform(-0.1, 0.1),
                risk_level=random.choice(["Low", "Medium", "High"])
            )
            db.session.add(profile)
        db.session.commit()

        # 3. Create Hospital Resources
        print("Creating Hospital Resources...")
        hospitals = User.query.filter_by(role="hospital").all()
        for h in hospitals:
            total = random.randint(50, 500)
            avail = random.randint(0, int(total * 0.3))
            icu = random.randint(5, 50)
            vent = random.randint(2, 20)
            res = HospitalResource(
                hospital_id=h.id,
                total_beds=total,
                available_beds=avail,
                icu_beds=icu,
                ventilators=vent
            )
            db.session.add(res)
        db.session.commit()

        # 4. Create Volunteers
        print("Creating Volunteers...")
        vols = User.query.filter_by(role="volunteer").all()
        skills = ["CPR", "First Aid", "Paramedic", "Doctor", "Driver"]
        for v in vols:
            vol = Volunteer(
                user_id=v.id,
                skills=",".join(random.sample(skills, 2)),
                availability_status=random.choice([True, False]),
                rating=round(random.uniform(3.5, 5.0), 1)
            )
            db.session.add(vol)
        db.session.commit()
        
        # 5. Create Blood Donors
        print("Creating Blood Donors...")
        for _ in range(50):
            p = random.choice(patients)
            donor = BloodDonor(
                user_id=p.id,
                blood_group=random.choice(blood_groups),
                last_donation_date=datetime.utcnow() - timedelta(days=random.randint(30, 365)),
                is_available=random.choice([True, False])
            )
            db.session.add(donor)
        db.session.commit()

        # 6. Create Emergencies (Past and Active)
        print("Creating Emergencies...")
        symptoms_list = ["Chest Pain", "Severe Bleeding", "Snake Bite", "Breathing Difficulty", "Accident"]
        for i in range(100):
            patient = random.choice(patients)
            status = random.choice(["PENDING", "ACCEPTED", "RESOLVED"])
            is_active = status != "RESOLVED"
            e_lat = 17.3850 + random.uniform(-0.2, 0.2)
            e_lng = 78.4867 + random.uniform(-0.2, 0.2)
            
            created = datetime.utcnow() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 24))
            
            em = Emergency(
                id=str(uuid.uuid4()),
                patient_id=str(patient.id),
                symptoms=random.choice(symptoms_list),
                risk_level=random.choice(["LOW", "HIGH", "CRITICAL"]),
                status=status,
                lat=e_lat,
                lng=e_lng,
                location_name=f"Location {i}",
                created_at=created,
                hospital_name=f"Hospital {random.choice(hospitals).id}" if not is_active and len(hospitals)>0 else None,
                hospital_lat=e_lat + 0.05 if not is_active else None,
                hospital_lng=e_lng + 0.05 if not is_active else None,
                resolved_at=created + timedelta(hours=2) if status == "RESOLVED" else None
            )
            db.session.add(em)
        db.session.commit()

        # Generate some audit blocks to populate blockchain dashboard
        print("Generating Mock Audit Blocks...")
        for em in Emergency.query.limit(20).all():
            create_audit_block("EMERGENCY_CREATED", {"id": em.id, "risk": em.risk_level})
            if em.status in ["ACCEPTED", "RESOLVED"]:
                 create_audit_block("EMERGENCY_ACCEPTED", {"id": em.id, "by": "Hospital A"})
                 
        print("Super Seed Complete!")

if __name__ == "__main__":
    super_seed()
