from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo
import calendar
from typing import Tuple, Optional

IST = ZoneInfo("Asia/Kolkata")
UTC = timezone.utc

def get_ist_now() -> datetime:
    """Returns current datetime in Indian Standard Time (Asia/Kolkata)."""
    return datetime.now(IST)

def to_ist(dt: Optional[datetime]) -> Optional[datetime]:
    """Converts a datetime to IST."""
    if not dt:
        return None
    if dt.tzinfo is None:
        # Assume stored as UTC if naive
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(IST)

def format_ist(dt: Optional[datetime], fmt: str = "%d-%b-%Y %I:%M %p") -> str:
    """Formats datetime to string in IST."""
    if not dt:
        return "N/A"
    ist_dt = to_ist(dt)
    return ist_dt.strftime(fmt)

def get_date_range_bounds(
    period: str = "day",
    date_str: Optional[str] = None,
    start_date_str: Optional[str] = None,
    end_date_str: Optional[str] = None
) -> Tuple[datetime, datetime, str]:
    """
    Parses date parameters and returns UTC (start_bound, end_bound) suitable for
    database filtering, along with a user-friendly label in IST.
    """
    now_ist = get_ist_now()

    # Parse reference date
    ref_date = now_ist.date()
    if date_str:
        try:
            ref_date = datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
        except Exception:
            pass

    period = (period or "day").lower()

    if period == "day":
        start_ist = datetime.combine(ref_date, time.min, tzinfo=IST)
        end_ist = datetime.combine(ref_date, time.max, tzinfo=IST)
        label = f"{ref_date.strftime('%d %b %Y')} (IST)"

    elif period == "week":
        # Monday of this week (weekday() returns 0 for Monday)
        monday = ref_date - timedelta(days=ref_date.weekday())
        sunday = monday + timedelta(days=6)
        start_ist = datetime.combine(monday, time.min, tzinfo=IST)
        end_ist = datetime.combine(sunday, time.max, tzinfo=IST)
        label = f"{monday.strftime('%d %b')} – {sunday.strftime('%d %b %Y')} (Week)"

    elif period == "month":
        year = ref_date.year
        month = ref_date.month
        last_day = calendar.monthrange(year, month)[1]
        start_ist = datetime.combine(ref_date.replace(day=1), time.min, tzinfo=IST)
        end_ist = datetime.combine(ref_date.replace(day=last_day), time.max, tzinfo=IST)
        label = f"{ref_date.strftime('%B %Y')}"

    elif period == "year":
        year = ref_date.year
        start_ist = datetime.combine(ref_date.replace(month=1, day=1), time.min, tzinfo=IST)
        end_ist = datetime.combine(ref_date.replace(month=12, day=31), time.max, tzinfo=IST)
        label = f"Year {year}"

    elif period == "custom":
        try:
            s_d = datetime.strptime(start_date_str.strip(), "%Y-%m-%d").date() if start_date_str else ref_date
        except Exception:
            s_d = ref_date
        try:
            e_d = datetime.strptime(end_date_str.strip(), "%Y-%m-%d").date() if end_date_str else ref_date
        except Exception:
            e_d = ref_date

        if s_d > e_d:
            s_d, e_d = e_d, s_d

        start_ist = datetime.combine(s_d, time.min, tzinfo=IST)
        end_ist = datetime.combine(e_d, time.max, tzinfo=IST)
        label = f"{s_d.strftime('%d %b %Y')} – {e_d.strftime('%d %b %Y')}"

    else:
        # Default fallback to day
        start_ist = datetime.combine(ref_date, time.min, tzinfo=IST)
        end_ist = datetime.combine(ref_date, time.max, tzinfo=IST)
        label = f"{ref_date.strftime('%d %b %Y')}"

    # Convert IST bounds to UTC for SQLite/PostgreSQL UTC timestamp comparisons
    start_utc = start_ist.astimezone(UTC).replace(tzinfo=None)
    end_utc = end_ist.astimezone(UTC).replace(tzinfo=None)

    return start_utc, end_utc, label
