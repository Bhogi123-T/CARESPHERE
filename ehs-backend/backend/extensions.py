from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_login import LoginManager

import os

db = SQLAlchemy()
socketio = SocketIO(
    cors_allowed_origins="*", async_mode="threading" if os.name == "nt" else None
)
login_manager = LoginManager()
login_manager.login_view = "login"
