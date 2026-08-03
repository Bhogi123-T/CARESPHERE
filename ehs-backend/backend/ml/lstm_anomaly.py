import json
import os
import random
from datetime import datetime, timedelta


def generate_lstm_anomaly_data():
    """
    Simulates an LSTM Autoencoder detecting behavioral anomalies (e.g. disease outbreaks).
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, "lstm_metrics.json")

    # Generate mock sequence data (reconstruction errors)
    sequence_length = 50
    normal_errors = [random.uniform(0.01, 0.04) for _ in range(sequence_length)]

    # Introduce some anomalies (high reconstruction error > 0.05)
    anomalous_indices = [12, 34, 45]
    for idx in anomalous_indices:
        normal_errors[idx] = random.uniform(0.08, 0.12)

    dates = [
        (datetime.now() - timedelta(days=sequence_length - i)).strftime("%Y-%m-%d")
        for i in range(sequence_length)
    ]

    data = []
    for i in range(sequence_length):
        is_anomaly = i in anomalous_indices
        data.append(
            {
                "date": dates[i],
                "reconstruction_error": round(normal_errors[i], 4),
                "is_anomaly": is_anomaly,
                "threshold": 0.05,
            }
        )

    metrics = {
        "model": "LSTM Autoencoder",
        "description": "Behavioral Anomaly Detection (Disease Outbreak Spikes)",
        "accuracy": 91.2,
        "precision": 87.6,
        "recall": 89.4,
        "false_alarm_rate": 8.8,
        "data": data,
    }

    with open(output_path, "w") as f:
        json.dump(metrics, f)

    print(f"LSTM Anomaly data saved to {output_path}")


if __name__ == "__main__":
    generate_lstm_anomaly_data()
