import pytest
from django.core.management import call_command
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

from apps.catalog.models import ContactMessage, Plan, Product, SupportRequest

pytestmark = pytest.mark.django_db


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.fixture
def seeded():
    call_command("seed_demo", "--publish")


# ========== PRODUCTS ==========
def test_products_empty(client):
    response = client.get(reverse("products"))
    assert response.status_code == 200
    assert response.json() == []
    assert response["ETag"].startswith('W/"')
    assert "max-age" in response["Cache-Control"]


def test_products_hide_drafts_and_private(client, seeded):
    slugs = {p["slug"] for p in client.get(reverse("products")).json()}
    assert slugs == {"vpn", "invoice"}  # khonsu is private and a draft

    vpn = Product.objects.get(slug="vpn")
    vpn.publish_status = Product.PublishStatus.DRAFT
    vpn.save()
    slugs = {p["slug"] for p in client.get(reverse("products")).json()}
    assert slugs == {"invoice"}


def test_private_product_is_never_public(client, seeded):
    Product.objects.filter(slug="khonsu").update(publish_status=Product.PublishStatus.PUBLISHED)
    assert "khonsu" not in {p["slug"] for p in client.get(reverse("products")).json()}
    assert client.get(reverse("product-detail", args=["khonsu"])).status_code == 404


def test_product_list_min_price_and_example_label(client, seeded):
    vpn = next(p for p in client.get(reverse("products")).json() if p["slug"] == "vpn")
    assert vpn["min_price"]["price"] == "5.00"
    assert vpn["min_price"]["currency"] == "USD"
    assert vpn["min_price"]["period"] == "month"
    assert vpn["has_example_prices"] is True
    assert vpn["availability"] == "available"
    assert vpn["prices_updated_at"] is not None


def test_product_detail_localised(client, seeded):
    uk = client.get(reverse("product-detail", args=["invoice"]), {"lang": "uk"}).json()
    en = client.get(reverse("product-detail", args=["invoice"]), {"lang": "en"}).json()
    assert uk["tagline"].startswith("Парсер")
    assert en["tagline"].startswith("Parser")
    assert len(uk["plans"]) == 3
    assert uk["plans"][2]["price"] is None and uk["plans"][2]["period"] == "on_request"
    assert uk["plans"][0]["buy_url"].endswith("/invoice/starter")
    assert len(uk["faq"]) == 2 and len(uk["features"]) == 6
    assert uk["seo"]["title"].startswith("MXXNLY Invoice")


def test_unpublished_plans_are_hidden(client, seeded):
    Plan.objects.filter(product__slug="vpn", name="Team").update(is_published=False)
    data = client.get(reverse("product-detail", args=["vpn"])).json()
    assert {p["name"] for p in data["plans"]} == {"Basic", "Pro"}


def test_etag_returns_304_until_content_changes(client, seeded):
    first = client.get(reverse("products"))
    etag = first["ETag"]
    assert client.get(reverse("products"), HTTP_IF_NONE_MATCH=etag).status_code == 304

    Product.objects.filter(slug="vpn").update(tagline_uk="Нова назва")  # update() skips signals
    Product.objects.get(slug="vpn").save()  # save() bumps the catalog version
    fresh = client.get(reverse("products"), HTTP_IF_NONE_MATCH=etag)
    assert fresh.status_code == 200
    assert fresh["ETag"] != etag
    assert fresh.json()[0]["tagline"] == "Нова назва" or any(
        p["tagline"] == "Нова назва" for p in fresh.json()
    )


def test_prices_endpoint(client, seeded):
    data = client.get(reverse("prices"), {"lang": "en"}).json()
    assert data["currency"] == "USD"
    assert data["refund_days"] == 14
    assert {p["slug"] for p in data["products"]} == {"vpn", "invoice"}
    assert all(plan["is_example"] for p in data["products"] for plan in p["plans"])


def test_site_content(client, seeded):
    data = client.get(reverse("site-content")).json()
    assert "support_sla" in data["settings"]
    assert data["testimonials"] == []  # none are visible by default


# ========== FORMS ==========
def test_contact_creates_message_with_attribution(client, seeded):
    payload = {
        "name": "Тарас",
        "email": "taras@example.com",
        "topic": "sales",
        "product": "vpn",
        "message": "Добрий день! Хочу дізнатися про план Team.",
        "attribution": {"utm_source": "google", "gclid": "abc123", "evil": "x" * 500},
    }
    response = client.post(
        reverse("contact"), payload, format="json", HTTP_X_FORWARDED_FOR="203.0.113.7"
    )

    assert response.status_code == 201
    message = ContactMessage.objects.get()
    assert message.product.slug == "vpn"
    assert message.attribution == {"utm_source": "google", "gclid": "abc123"}
    assert message.ip_hash and "203.0.113.7" not in message.ip_hash
    assert message.is_read is False


def test_contact_validates_input(client):
    response = client.post(
        reverse("contact"), {"name": "A", "email": "nope", "message": "short"}, format="json"
    )
    assert response.status_code == 400
    assert {"name", "email", "message"} <= set(response.json())
    assert not ContactMessage.objects.exists()


def test_honeypot_is_silently_dropped(client):
    payload = {
        "name": "Bot",
        "email": "bot@example.com",
        "message": "Buy cheap stuff right now!!!",
        "website": "http://spam.example",
    }
    assert client.post(reverse("contact"), payload, format="json").status_code == 201
    assert not ContactMessage.objects.exists()


def test_support_request(client, seeded):
    payload = {
        "name": "Олена",
        "email": "olena@example.com",
        "subject": "Не розпізнає скан",
        "message": "Скан PDF не розпізнається, помилка 500.",
        "product": "invoice",
    }
    response = client.post(reverse("support"), payload, format="json")
    assert response.status_code == 201
    request = SupportRequest.objects.get()
    assert request.status == SupportRequest.Status.NEW
    assert request.product.slug == "invoice"


def test_forms_are_throttled(client, monkeypatch):
    monkeypatch.setattr(ScopedRateThrottle, "THROTTLE_RATES", {"forms": "2/min"})
    payload = {"name": "Ann", "email": "ann@example.com", "message": "Hello there, friend!"}
    codes = [client.post(reverse("contact"), payload, format="json").status_code for _ in range(3)]
    assert codes == [201, 201, 429]


def test_turnstile_required_when_configured(client, settings, monkeypatch):
    settings.TURNSTILE_SECRET_KEY = "secret"
    monkeypatch.setattr("apps.catalog.views.verify_turnstile", lambda token, ip: token == "good")
    payload = {"name": "Ann", "email": "ann@example.com", "message": "Hello there, friend!"}
    assert (
        client.post(
            reverse("contact"), {**payload, "turnstile_token": "bad"}, format="json"
        ).status_code
        == 400
    )
    assert (
        client.post(
            reverse("contact"), {**payload, "turnstile_token": "good"}, format="json"
        ).status_code
        == 201
    )


# ========== CORE ==========
def test_company_endpoint_exposes_public_data_and_flags(client):
    data = client.get(reverse("company")).json()
    assert data["company"]["brand"]["name"] == "MXXNLY Labs"
    assert data["company"]["seller"]["legal_name"].startswith("ФОП")
    assert "seller.tax_id" in data["company"]["placeholders"]
    assert data["flags"]["has_placeholders"] is True
    assert data["flags"]["indexable"] is False


def test_noindex_header_while_placeholders_remain(client):
    response = client.get(reverse("products"))
    assert response["X-Robots-Tag"] == "noindex, nofollow"


def test_robots_disallows_everything_while_placeholders_remain(client):
    response = client.get("/robots.txt")
    assert response.status_code == 200
    assert "Disallow: /" in response.content.decode()


def test_sitemap_lists_products_in_both_languages(client, seeded):
    body = client.get("/sitemap.xml").content.decode()
    assert "/uk/products/vpn</loc>" in body
    assert "/en/products/invoice</loc>" in body
    assert "khonsu" not in body
    assert 'hreflang="x-default"' in body


def test_health_ignores_allowed_hosts(client, settings):
    settings.ALLOWED_HOSTS = ["example.com"]
    response = client.get("/api/health/", HTTP_HOST="localhost:8000")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
