import json
import os
import random
import subprocess
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

MAILER_PATH = Path(__file__).resolve().parent / "mailer.js"


def generate_otp() -> str:
    """Generate a 6-digit OTP code."""
    return str(random.randint(100000, 999999))


def _send_otp_via_nodemailer(to_email: str, otp_code: str, flow: str) -> bool:
    # Reload env so updated SMTP values are picked up even if process is already running.
    load_dotenv(override=True)

    smtp_email = os.getenv("SMTP_EMAIL", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")

    if not smtp_email or not smtp_password:
        print("[ERROR] SMTP_EMAIL/SMTP_PASSWORD missing. OTP email not sent.")
        return False

    payload = {"to": to_email, "otp": otp_code, "flow": flow}

    try:
        result = subprocess.run(
            ["node", str(MAILER_PATH)],
            input=json.dumps(payload),
            text=True,
            capture_output=True,
            check=False,
            timeout=20,
        )
    except Exception as exc:
        print(f"[ERROR] Failed to execute Nodemailer script: {exc}")
        return False

    if result.returncode != 0:
        print(f"[ERROR] Nodemailer script failed: {result.stderr.strip()}")
        return False

    try:
        output = json.loads(result.stdout.strip() or "{}")
    except json.JSONDecodeError:
        print(f"[ERROR] Invalid mailer response: {result.stdout.strip()}")
        return False

    if output.get("skipped"):
        print("[ERROR] Nodemailer skipped sending OTP")
        return False

    if not output.get("ok"):
        print(f"[ERROR] Nodemailer send failed: {output.get('error', 'Unknown error')}")
        return False

    if result.stderr.strip():
        print(f"[WARN] Nodemailer stderr: {result.stderr.strip()}")

    if result.stdout.strip():
        print(f"[DEBUG] Nodemailer response: {result.stdout.strip()}")

    print(f"[OK] OTP email sent to {to_email} via Nodemailer")
    return True


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """Send signup OTP email using Nodemailer."""
    return _send_otp_via_nodemailer(to_email, otp_code, "signup")


def send_reset_otp_email(to_email: str, otp_code: str) -> bool:
    """Send forgot-password OTP email using Nodemailer."""
    return _send_otp_via_nodemailer(to_email, otp_code, "reset")
