from flask import Blueprint, request, jsonify
from backend.extensions import socketio

smart_city_bp = Blueprint("smart_city_bp", __name__)


@smart_city_bp.route("/traffic-override", methods=["POST"])
def traffic_override():
    """
    Simulates interfacing with city infrastructure to preempt traffic lights.
    Turns lights green along an ambulance's route.
    """
    data = request.json
    ambulance_id = data.get("ambulance_id")
    emergency_id = data.get("emergency_id")
    route_coordinates = data.get("route_coordinates", [])  # List of lat/lng dicts

    if not ambulance_id or not route_coordinates:
        return jsonify({"msg": "Missing ambulance_id or route_coordinates"}), 400

    # Simulate calculating intersections and sending commands to traffic light API
    cleared_intersections = len(route_coordinates)

    # Broadcast to network that a priority corridor is active
    socketio.emit(
        "traffic_lights_green",
        {
            "ambulance_id": ambulance_id,
            "emergency_id": emergency_id,
            "cleared_intersections": cleared_intersections,
            "status": "ACTIVE_CORRIDOR",
        },
    )

    return (
        jsonify(
            {
                "msg": "Traffic preemption activated",
                "cleared_intersections": cleared_intersections,
            }
        ),
        200,
    )
