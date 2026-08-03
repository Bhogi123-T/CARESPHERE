import hashlib
import json
from datetime import datetime
from backend.extensions import db
from backend.models import AuditLog


def calculate_hash(index, action, details, previous_hash, timestamp_str):
    data_string = f"{index}{action}{details}{previous_hash}{timestamp_str}"
    return hashlib.sha256(data_string.encode("utf-8")).hexdigest()


def create_audit_block(action, details_dict):
    details_str = json.dumps(details_dict, sort_keys=True)

    # Get the latest block
    last_block = AuditLog.query.order_by(AuditLog.id.desc()).first()

    previous_hash = last_block.block_hash if last_block else "0" * 64
    index = (last_block.id + 1) if last_block else 1

    timestamp = datetime.utcnow()
    timestamp_str = timestamp.isoformat()

    block_hash = calculate_hash(
        index, action, details_str, previous_hash, timestamp_str
    )

    new_block = AuditLog(
        action=action,
        details=details_str,
        previous_hash=previous_hash,
        block_hash=block_hash,
        timestamp=timestamp,
    )

    db.session.add(new_block)
    # The caller is responsible for committing the session
    return new_block


def verify_blockchain():
    blocks = AuditLog.query.order_by(AuditLog.id.asc()).all()

    if not blocks:
        return True, "Blockchain is empty."

    for i in range(len(blocks)):
        current_block = blocks[i]

        # Re-calculate hash
        calculated_hash = calculate_hash(
            current_block.id,
            current_block.action,
            current_block.details,
            current_block.previous_hash,
            current_block.timestamp.isoformat(),
        )

        if current_block.block_hash != calculated_hash:
            return False, f"Hash mismatch at block ID {current_block.id}"

        if i > 0:
            previous_block = blocks[i - 1]
            if current_block.previous_hash != previous_block.block_hash:
                return (
                    False,
                    f"Chain broken between block {previous_block.id} and {current_block.id}",
                )

    return True, "Blockchain is completely intact and verified."
