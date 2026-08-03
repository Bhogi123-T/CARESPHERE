import hashlib
import json
from datetime import datetime
from backend.models import AuditLog
from backend.extensions import db


def generate_hash(previous_hash, action, details, timestamp):
    block_string = f"{previous_hash}{action}{details}{timestamp}".encode()
    return hashlib.sha256(block_string).hexdigest()


def create_audit_block(action, details_dict):
    """
    Creates a cryptographic block in the AuditLog simulating a blockchain ledger.
    """
    details_str = json.dumps(details_dict, sort_keys=True)
    timestamp_str = datetime.utcnow().isoformat()

    # Get last block to link the chain
    last_block = AuditLog.query.order_by(AuditLog.id.desc()).first()
    previous_hash = (
        last_block.block_hash if last_block else "GENESIS_HASH_000000000000000000"
    )

    block_hash = generate_hash(previous_hash, action, details_str, timestamp_str)

    new_block = AuditLog(
        action=action,
        details=details_str,
        previous_hash=previous_hash,
        block_hash=block_hash,
    )
    db.session.add(new_block)
    db.session.commit()

    return new_block
