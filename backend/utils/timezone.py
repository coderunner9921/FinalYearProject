# skillbridge/backend/utils/timezone.py
from datetime import datetime
import pytz

def convert_utc_to_ist(utc_datetime):
    """Convert UTC datetime to IST (Indian Standard Time)"""
    if utc_datetime is None:
        return None
    
    # Ensure the datetime has UTC timezone info
    if utc_datetime.tzinfo is None:
        utc_datetime = utc_datetime.replace(tzinfo=pytz.UTC)
    
    # Convert to IST
    ist_tz = pytz.timezone('Asia/Kolkata')
    ist_datetime = utc_datetime.astimezone(ist_tz)
    return ist_datetime

def format_datetime_for_display(dt, format_string='%Y-%m-%d %H:%M:%S'):
    """Format datetime for display with proper timezone handling"""
    if dt is None:
        return "N/A"
    
    # Convert to IST if it's UTC
    if dt.tzinfo is None:
        # Assume UTC if no timezone info
        dt = dt.replace(tzinfo=pytz.UTC)
    
    ist_dt = convert_utc_to_ist(dt)
    return ist_dt.strftime(format_string)

def get_current_ist_time():
    """Get current time in IST"""
    utc_now = datetime.utcnow().replace(tzinfo=pytz.UTC)
    return convert_utc_to_ist(utc_now)