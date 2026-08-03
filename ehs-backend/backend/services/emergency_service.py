from backend.models.database import save_emergency


def handle_emergency(data):
    emergency_record = {
        "patient": data.get("patient"),
        "symptoms": data.get("symptoms"),
        "location": data.get("location"),
        "status": "SENT TO HOSPITAL + AMBULANCE",
    }

    save_emergency(emergency_record)

    return {
        "message": "Emergency alert sent successfully",
        "status": "ACTIVE RESPONSE TRIGGERED",
    }
