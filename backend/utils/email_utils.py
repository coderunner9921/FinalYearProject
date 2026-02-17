# backend\utils\email_utils.py
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")


def send_reset_email(to_email: str, reset_link: str):
    """
    Send password reset email with HTML template.
    This is a synchronous function safe to use with FastAPI BackgroundTasks.
    """
    if not EMAIL_USER or not EMAIL_PASS:
        print("⚠️ EMAIL_USER or EMAIL_PASS not configured in .env")
        print(f"⚠️ Skipping email send to: {to_email}")
        return

    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "SkillBridge Password Reset Request"
        msg["From"] = EMAIL_USER
        msg["To"] = to_email

        # HTML email template
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; background: #f9fafb; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #6366f1; margin: 0;">SkillBridge</h1>
                        <p style="color: #6b7280; margin: 5px 0;">AI-Powered Mock Interviews</p>
                    </div>
                    
                    <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
                    
                    <p style="color: #374151; line-height: 1.6;">Hello,</p>
                    
                    <p style="color: #374151; line-height: 1.6;">
                        We received a request to reset your SkillBridge account password. 
                        Click the button below to create a new password:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" 
                           style="background: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
                                  color: white; 
                                  padding: 14px 40px; 
                                  text-decoration: none; 
                                  border-radius: 10px; 
                                  font-weight: bold; 
                                  display: inline-block;
                                  box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3);">
                           Reset Password
                        </a>
                    </div>
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                            ⏱️ <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                        </p>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                        If you didn't request this password reset, you can safely ignore this email. 
                        Your password will remain unchanged.
                    </p>
                    
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                        If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    
                    <p style="background: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #6366f1;">
                        {reset_link}
                    </p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    
                    <div style="text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
                            © 2025 SkillBridge. All rights reserved.
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
                            Need help? Contact us at support@skillbridge.com
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """

        msg.attach(MIMEText(html_content, "html"))

        # Send email via SMTP
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=30) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, to_email, msg.as_string())

        print(f"✅ Password reset email sent successfully to: {to_email}")
        return True

    except smtplib.SMTPAuthenticationError:
        print("❌ SMTP Authentication failed. Check EMAIL_USER and EMAIL_PASS in .env")
        return False
    except smtplib.SMTPException as e:
        print(f"❌ SMTP error occurred: {e}")
        return False
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False