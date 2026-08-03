import json
import os

DB_PATH = "database/emergencies.json"


def save_emergency(data):
    if not os.path.exists(DB_PATH):
        with open(DB_PATH, "w") as f:
            json.dump([], f)

    with open(DB_PATH, "r") as f:
        records = json.load(f)

    records.append(data)

    with open(DB_PATH, "w") as f:
        json.dump(records, f, indent=4)

    return True


def get_all_emergencies():
    if not os.path.exists(DB_PATH):
        return []
    with open(DB_PATH, "r") as f:
        return json.load(f)
