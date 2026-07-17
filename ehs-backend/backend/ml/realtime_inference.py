def analyze_vitals_stream(vitals_data):
    """
    Simulates a real-time ML inference engine (like an LSTM Autoencoder or Risk Model).
    Takes a dictionary of vitals and returns anomaly status and calculated risk score.
    
    Expected vitals_data format:
    {
        'heart_rate': int,
        'blood_pressure': str, (e.g., '120/80')
        'spo2': int
    }
    """
    try:
        hr = int(vitals_data.get('heart_rate', 75))
        spo2 = int(vitals_data.get('spo2', 98))
        
        # Simple string parsing for BP
        bp_str = vitals_data.get('blood_pressure', '120/80')
        sys_bp, dia_bp = map(int, bp_str.split('/'))
        
        # Base risk calculation
        risk_score = 0
        anomaly_reasons = []
        
        # LSTM simulated anomaly bounds
        if hr > 120 or hr < 50:
            risk_score += 40
            anomaly_reasons.append(f"Abnormal Heart Rate: {hr} bpm")
            
        if spo2 < 92:
            risk_score += 50
            anomaly_reasons.append(f"Low SpO2: {spo2}%")
            
        if sys_bp > 160 or sys_bp < 90:
            risk_score += 30
            anomaly_reasons.append(f"Abnormal Systolic BP: {sys_bp}")
            
        if dia_bp > 100 or dia_bp < 60:
            risk_score += 20
            anomaly_reasons.append(f"Abnormal Diastolic BP: {dia_bp}")
            
        # Add slight random noise to risk score to simulate continuous model variance
        import random
        noise = random.uniform(-2, 2)
        risk_score = max(0, min(100, risk_score + noise))
        
        is_anomaly = len(anomaly_reasons) > 0
        
        return {
            "is_anomaly": is_anomaly,
            "risk_score": round(risk_score, 1),
            "reasons": anomaly_reasons,
            "timestamp": __import__('datetime').datetime.now().isoformat()
        }
        
    except Exception as e:
        # Fallback if data format is bad
        return {
            "is_anomaly": False,
            "risk_score": 0.0,
            "reasons": [],
            "error": str(e),
            "timestamp": __import__('datetime').datetime.now().isoformat()
        }
