import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def generate_otp() -> str:
    """Generate a 6-digit OTP code."""
    return str(random.randint(100000, 999999))


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """Send an OTP verification email. Returns True on success."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("[WARN] SMTP credentials not set. OTP email not sent.")
        print(f"[DEV] OTP for {to_email}: {otp_code}")
        return True  # Allow dev flow to continue

    subject = "TradePulse - Verify Your Email"

    html_body = f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;
                background:#0a0a0a;border:1px solid #222;border-radius:16px;padding:40px;
                color:#e0e0e0;">
        <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:32px;">&#9889;</span>
            <h1 style="margin:8px 0 0;font-size:20px;
                       background:linear-gradient(90deg,#d4a017,#f0c040);
                       -webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                TradePulse
            </h1>
        </div>

        <h2 style="text-align:center;color:#fff;font-size:22px;margin-bottom:8px;">
            Verify Your Email
        </h2>
        <p style="text-align:center;color:#888;font-size:14px;margin-bottom:28px;">
            Enter the code below to complete your registration
        </p>

        <div style="text-align:center;background:#111;border:1px solid #333;
                    border-radius:12px;padding:20px;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#f0c040;">
                {otp_code}
            </span>
        </div>

        <p style="text-align:center;color:#666;font-size:12px;">
            This code expires in <strong style="color:#d4a017;">10 minutes</strong>.<br>
            If you didn't request this, you can safely ignore this email.
        </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["From"] = f"TradePulse <{SMTP_EMAIL}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(f"Your OTP code is: {otp_code}\n\nThis code expires in 10 minutes.", "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        print(f"[OK] OTP email sent to {to_email}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send OTP email to {to_email}: {e}")
        return False
