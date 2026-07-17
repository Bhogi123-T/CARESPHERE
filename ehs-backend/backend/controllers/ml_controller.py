from flask import Blueprint, jsonify
import os
import json

ml_bp = Blueprint('ml', __name__)

@ml_bp.route('/metrics', methods=['GET'])
def get_ml_metrics():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        ml_dir = os.path.join(os.path.dirname(current_dir), 'ml')
        metrics_path = os.path.join(ml_dir, 'metrics.json')
        
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r') as f:
                metrics = json.load(f)
            return jsonify({
                "status": "success",
                "model": "RandomForestClassifier",
                "metrics": metrics
            }), 200
        else:
            return jsonify({"status": "error", "msg": "Metrics not found. Train the model first."}), 404
            
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

@ml_bp.route('/anomaly', methods=['GET'])
def get_lstm_anomaly():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        ml_dir = os.path.join(os.path.dirname(current_dir), 'ml')
        metrics_path = os.path.join(ml_dir, 'lstm_metrics.json')
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r') as f:
                metrics = json.load(f)
            return jsonify(metrics), 200
        return jsonify({"status": "error", "msg": "LSTM metrics not found."}), 404
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

@ml_bp.route('/route', methods=['GET'])
def get_dqn_route():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        ml_dir = os.path.join(os.path.dirname(current_dir), 'ml')
        metrics_path = os.path.join(ml_dir, 'dqn_metrics.json')
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r') as f:
                metrics = json.load(f)
            return jsonify(metrics), 200
        return jsonify({"status": "error", "msg": "DQN metrics not found."}), 404
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

@ml_bp.route('/gan-data', methods=['GET'])
def get_gan_data():
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        ml_dir = os.path.join(os.path.dirname(current_dir), 'ml')
        metrics_path = os.path.join(ml_dir, 'gan_metrics.json')
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r') as f:
                metrics = json.load(f)
            return jsonify(metrics), 200
        return jsonify({"status": "error", "msg": "GAN metrics not found."}), 404
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500
