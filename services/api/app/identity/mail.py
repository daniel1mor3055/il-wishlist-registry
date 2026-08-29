"""Outbound mail, which in this POC means Mailpit.

One function, plain SMTP, no template engine and no provider SDK. Mailpit
accepts anything on port 1025 and shows it at :8025, so "did the login mail go
out and does the link work" is checkable by eye.

Send failures are logged and swallowed. The endpoint above this answers `202`
whether or not the address exists (no account enumeration), so it must answer
`202` when the mail server is down as well - otherwise the response code becomes
the oracle that the address check was not.
"""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.config import get_settings

log = logging.getLogger(__name__)

FROM_ADDRESS = "hello@registry.local"
SUBJECT = "הקישור לרשימת הלידה שלכם"


def send_magic_link(*, to: str, link: str) -> bool:
    """Mail the one-time link. Returns whether it left the building."""
    settings = get_settings()

    message = EmailMessage()
    message["From"] = FROM_ADDRESS
    message["To"] = to
    message["Subject"] = SUBJECT
    message.set_content(
        "היי,\n\n"
        "הקישור לעריכת רשימת הלידה שלכם:\n"
        f"{link}\n\n"
        "הקישור תקף ל-20 דקות ולשימוש אחד.\n"
        "אם לא ביקשתם אותו, אפשר להתעלם מהמייל הזה.\n"
    )

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=5) as smtp:
            smtp.send_message(message)
        return True
    except OSError as exc:
        # Includes a Mailpit that is not running, which is a local-setup problem
        # and not something to hand to whoever is trying to log in.
        log.warning("magic link mail failed: %s", exc)
        return False
