import smtplib
from email.message import EmailMessage

# MailHog SMTP Configuration
SMTP_SERVER = "localhost"
SMTP_PORT = 1025  # MailHog's default SMTP port

SENDER_EMAIL = "no-reply@example.com"
SENDER_NAME = "Your App Name"

def send_invite_email(recipient_email: str, invite_link: str):
    """
    Sends an invitation email with a unique registration link.
    
    :param recipient_email: The email of the invitee.
    :param invite_link: The unique invitation link.
    """
    try:
        # Create email message
        msg = EmailMessage()
        msg["Subject"] = "You're Invited to Join CARMA"
        msg["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
        msg["To"] = recipient_email
        msg.set_content(f"""
        Hello,

        You have been invited to join CARMA (carbon emission data managing tool). Click the link below to complete your registration:

        {invite_link}

        This link will expire in 30 days.

        Best regards,  
        {SENDER_NAME}
        """)

        # Connect to MailHog's SMTP server and send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.send_message(msg)

        print(f"✅ Invitation sent to {recipient_email}")

    except Exception as e:
        print(f"❌ Failed to send invite: {e}")
