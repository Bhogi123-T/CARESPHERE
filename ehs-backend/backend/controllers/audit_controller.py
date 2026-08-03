from flask import Blueprint, jsonify
from backend.models import AuditLog
from backend.utils.blockchain import verify_blockchain

audit_bp = Blueprint("audit_bp", __name__)


@audit_bp.route("/verify", methods=["GET"])
def verify_chain():
    is_valid, message = verify_blockchain()

    if is_valid:
        return jsonify({"valid": True, "msg": message}), 200
    else:
        return jsonify({"valid": False, "msg": message}), 400


@audit_bp.route("/ledger", methods=["GET"])
def get_ledger():
    blocks = AuditLog.query.order_by(AuditLog.id.desc()).all()

    chain = []
    for block in blocks:
        chain.append(
            {
                "id": block.id,
                "action": block.action,
                "details": block.details,
                "previous_hash": block.previous_hash,
                "block_hash": block.block_hash,
                "timestamp": block.timestamp.isoformat(),
            }
        )

    return jsonify({"chain": chain}), 200
