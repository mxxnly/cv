"""Email / Telegram notifications for new form entries, sent in a background thread."""

import json
import logging
import threading
import urllib.request

from django.conf import settings
from django.core.mail import send_mail

from .models import ContactMessage, SupportRequest

logger = logging.getLogger(__name__)


def _format(entry: ContactMessage | SupportRequest) -> str:
    site = settings.SITE_NAME
    if isinstance(entry, SupportRequest):
        header = f"{site}: нове звернення в підтримку #{entry.pk}\nТема: {entry.subject}"
    else:
        header = f"{site}: нове повідомлення з сайту #{entry.pk}\nТема: {entry.get_topic_display()}"
    product = f"\nПродукт: {entry.product.name}" if entry.product else ""
    source = (
        ", ".join(f"{k}={v}" for k, v in entry.attribution.items())
        if entry.attribution
        else "немає"
    )
    sender = f"{entry.name} <{entry.email}>"
    return f"{header}{product}\nВід: {sender}\nДжерело: {source}\n\n{entry.message}"


def _kind(entry) -> str:
    return "звернення" if isinstance(entry, SupportRequest) else "повідомлення"


def _send_email(entry) -> None:
    send_mail(
        subject=f"{settings.SITE_NAME}: {_kind(entry)} від {entry.name}",
        message=_format(entry),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.CONTACT_NOTIFY_EMAIL],
        fail_silently=False,
    )


def _send_telegram(entry) -> None:
    payload = json.dumps({"chat_id": settings.TELEGRAM_CHAT_ID, "text": _format(entry)}).encode()
    request = urllib.request.Request(
        f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=10):
        pass


def _notify(entry) -> None:
    senders = []
    if settings.CONTACT_NOTIFY_EMAIL:
        senders.append(_send_email)
    if settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_CHAT_ID:
        senders.append(_send_telegram)
    for sender in senders:
        try:
            sender(entry)
        except Exception:
            logger.exception("Notification via %s failed for entry #%s", sender.__name__, entry.pk)


def notify_new_entry(entry) -> None:
    """Send notifications in the background so the visitor never waits for SMTP/Telegram."""
    threading.Thread(target=_notify, args=(entry,), daemon=True).start()
