from app import app, db
from backend.models import (
    User,
    PatientProfile,
    Emergency,
    Volunteer,
    Pharmacy,
    BloodDonor,
    BloodRequest,
    PharmacyInventory,
)
import uuid


def seed_data():
    with app.app_context():
        # Ensure tables exist
        db.create_all()

        if User.query.first():
            print("Database already contains data. Skipping seed to prevent data loss.")
            return
            print("Database already contains data. Skipping seed to prevent data loss.")
            return

        print("Seeding database...")

        # Create Users
        users_data = [
            {
                "contact_info": "patient1@test.com",
                "password": "password",
                "role": "patient",
            },
            {
                "contact_info": "hospital1@test.com",
                "password": "password",
                "role": "hospital",
            },
            {
                "contact_info": "ambulance1@test.com",
                "password": "password",
                "role": "ambulance",
            },
            {"contact_info": "gov1@test.com", "password": "password", "role": "gov"},
            {
                "contact_info": "donor1@test.com",
                "password": "password",
                "role": "blood_donor",
            },
            {
                "contact_info": "volunteer1@test.com",
                "password": "password",
                "role": "volunteer",
            },
        ]

        from werkzeug.security import generate_password_hash

        users = []
        for ud in users_data:
            hashed_pw = generate_password_hash(ud["password"])
            u = User(
                contact_info=ud["contact_info"], password=hashed_pw, role=ud["role"]
            )
            db.session.add(u)
            users.append(u)
        db.session.commit()

        # Get User IDs
        patient_id = User.query.filter_by(contact_info="patient1@test.com").first().id
        hospital_id = User.query.filter_by(contact_info="hospital1@test.com").first().id
        donor_id = User.query.filter_by(contact_info="donor1@test.com").first().id
        volunteer_id = (
            User.query.filter_by(contact_info="volunteer1@test.com").first().id
        )

        # Create Patient Profile
        profile = PatientProfile(
            user_id=patient_id,
            name="Rahul Sharma",
            age=32,
            blood_group="O+",
            medical_history="Hypertension, Asthma",
            family_contact="9876543210",
            lat=12.8898,
            lng=80.2315,
            risk_level="Medium",
        )
        db.session.add(profile)

        # Create Volunteer
        vol = Volunteer(
            user_id=volunteer_id,
            skills="First Aid, CPR",
            availability_status=True,
            rating=4.8,
        )
        db.session.add(vol)

        # Create Blood Donor
        donor = BloodDonor(user_id=donor_id, blood_group="O+", is_available=True)
        db.session.add(donor)

        # Create Emergencies
        e1 = Emergency(
            id=str(uuid.uuid4()),
            patient_id=str(patient_id),
            symptoms="Severe chest pain and shortness of breath",
            risk_level="CRITICAL",
            status="PENDING",
            lat=12.8898,
            lng=80.2315,
            location_name="Near Panaiyur, Tamil Nadu",
        )
        e2 = Emergency(
            id=str(uuid.uuid4()),
            patient_id=str(patient_id),
            symptoms="Snake bite on the right leg",
            risk_level="HIGH",
            status="ACCEPTED",
            accepted_by="ambulance1@test.com",
            lat=12.8900,
            lng=80.2300,
            location_name="ECR Road, Tamil Nadu",
        )
        db.session.add_all([e1, e2])

        # Create Blood Requests
        br1 = BloodRequest(
            id=str(uuid.uuid4()),
            patient_id=str(patient_id),
            blood_group="O+",
            units_needed=2,
            status="PENDING",
            lat=12.8898,
            lng=80.2315,
        )
        db.session.add(br1)

        # Create Pharmacy Inventory
        inventory = [
            PharmacyInventory(
                name="Paracetamol", category="Fever", stock=150, status="OPTIMAL"
            ),
            PharmacyInventory(
                name="Amoxicillin", category="Antibiotic", stock=10, status="LOW"
            ),
            PharmacyInventory(
                name="Anti-Venom", category="Critical", stock=0, status="OUT_OF_STOCK"
            ),
            PharmacyInventory(
                name="Insulin", category="Diabetes", stock=5, status="LOW"
            ),
        ]
        db.session.add_all(inventory)

        db.session.commit()
        print("Database seeded successfully with realistic test data!")


if __name__ == "__main__":
    seed_data()
