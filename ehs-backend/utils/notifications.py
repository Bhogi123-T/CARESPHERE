import os
import logging

try:
    from twilio.rest import Client
except ImportError:
    Client = None

logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    def send_sms(to_number, message):
        twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        twilio_from_number = os.getenv("TWILIO_FROM_NUMBER")

        from backend.models import NotificationLog
        from backend.extensions import db
        from flask import current_app

        def log_notification(status):
            try:
                if current_app:
                    log = NotificationLog(
                        recipient=to_number, message=message, status=status
                    )
                    db.session.add(log)
                    db.session.commit()
            except Exception as inner_e:
                logger.error(f"Failed to log notification to DB: {inner_e}")

        if (
            not (twilio_account_sid and twilio_auth_token and twilio_from_number)
            or Client is None
        ):
            logger.info(f"[SIMULATED SMS to {to_number}]: {message}")
            log_notification("SENT")
            return True

        try:
            client = Client(twilio_account_sid, twilio_auth_token)
            twilio_message = client.messages.create(
                body=message, from_=twilio_from_number, to=to_number
            )
            logger.info(f"SMS sent successfully: {twilio_message.sid}")
            log_notification("SENT")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            log_notification("FAILED")
            return False

    @staticmethod
    def send_email(to_email, subject, body):
        smtp_server = os.getenv("SMTP_SERVER")
        if not smtp_server:
            logger.info(
                f"[SIMULATED EMAIL to {to_email}] Subject: {subject} | Body: {body}"
            )
            return True

        # Real SMTP logic goes here using smtplib or SendGrid
        logger.info(f"Email would be sent to {to_email} via {smtp_server}")
        return True
