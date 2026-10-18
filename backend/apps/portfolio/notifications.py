import json
import logging
import threading
import urllib.request

from django.conf import settings
from django.core.mail import send_mail

from .models import ContactMessage

logger = logging.getLogger(__name__)


def _format(message: ContactMessage) -> str:
    subject = f"\nSubject: {message.subject}" if message.subject else ""
    sender = f"{message.name} <{message.email}>"
    return f"New message from the portfolio\n\nFrom: {sender}{subject}\n\n{message.message}"


def _send_email(message: ContactMessage) -> None:
    send_mail(
        subject=f"Portfolio: message from {message.name}",
        message=_format(message),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.CONTACT_NOTIFY_EMAIL],
        fail_silently=False,
    )


def _send_telegram(message: ContactMessage) -> None:
    payload = json.dumps({"chat_id": settings.TELEGRAM_CHAT_ID, "text": _format(message)}).encode()
    request = urllib.request.Request(
        f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=10):
        pass


def _notify(message: ContactMessage) -> None:
    senders = []
    if settings.CONTACT_NOTIFY_EMAIL:
        senders.append(_send_email)
    if settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_CHAT_ID:
        senders.append(_send_telegram)

    for sender in senders:
        try:
            sender(message)
        except Exception:
            logger.exception("Contact notification via %s failed", sender.__name__)


def notify_new_message(message: ContactMessage) -> None:
    """Send notifications in the background so the visitor never waits for SMTP/Telegram."""
    threading.Thread(target=_notify, args=(message,), daemon=True).start()
