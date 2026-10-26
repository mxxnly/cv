"""Optional Cloudflare Turnstile verification (enabled when TURNSTILE_SECRET_KEY is set)."""

import json
import logging
import urllib.parse
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)
VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def verify_turnstile(token: str, remote_ip: str = "") -> bool:
    if not token:
        return False
    payload = {"secret": settings.TURNSTILE_SECRET_KEY, "response": token}
    if remote_ip:
        payload["remoteip"] = remote_ip
    request = urllib.request.Request(VERIFY_URL, data=urllib.parse.urlencode(payload).encode())
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            return bool(json.load(response).get("success"))
    except Exception:
        logger.warning("Turnstile verification request failed", exc_info=True)
        return False
