import os
import time
import random
import socketio

sio = socketio.Client()

def simulate():
    try:
        backend_url = os.environ.get("BACKEND_URL", "http://localhost:5000")
        print(f"Connecting to server at {backend_url}...")
        sio.connect(backend_url)
        print("Connected! Starting simulation...")
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    emergency_id = "test-simulation-123"
    lat, lng = 17.3850, 78.4867
    
    while True:
        try:
            # Simulate vitals
            vitals = {
                "emergency_id": emergency_id,
                "heart_rate": random.randint(60, 150),
                "blood_pressure_sys": random.randint(90, 180),
                "blood_pressure_dia": random.randint(60, 110),
                "spo2": random.randint(85, 100),
                "temperature": round(random.uniform(97.0, 103.0), 1)
            }
            sio.emit("stream_vitals", vitals)
            
            # Simulate ambulance movement
            lat += random.uniform(-0.001, 0.001)
            lng += random.uniform(-0.001, 0.001)
            location_update = {
                "emergency_id": emergency_id,
                "lat": lat,
                "lng": lng,
                "distance_left": f"{round(random.uniform(0.5, 5.0), 1)} km",
                "eta_left": f"{random.randint(2, 15)} mins"
            }
            sio.emit("ambulance_location_update", location_update)
            
            print(f"Emitted vitals and location for {emergency_id}")
            time.sleep(2)
        except Exception as e:
            print(f"Simulation error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    simulate()
