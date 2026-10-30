import pytest
from django.core.management import call_command
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

from apps.catalog.models import ContactMessage, Plan, Product, SupportRequest, TeamMember

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
    assert len(slugs) == 18
    assert {"vpn", "selene", "khonsu", "lunaflow"} <= slugs

    vpn = Product.objects.get(slug="vpn")
    vpn.publish_status = Product.PublishStatus.DRAFT
    vpn.save()
    slugs = {p["slug"] for p in client.get(reverse("products")).json()}
    assert "vpn" not in slugs
    assert len(slugs) == 17


def test_private_product_is_never_public(client, seeded):
    Product.objects.create(
        name="MXXNLY Secret",
        slug="secret",
        tagline_uk="x",
        publish_status=Product.PublishStatus.PUBLISHED,
        is_private=True,
    )
    assert "secret" not in {p["slug"] for p in client.get(reverse("products")).json()}
    assert client.get(reverse("product-detail", args=["secret"])).status_code == 404


def test_product_list_min_price_and_example_label(client, seeded):
    vpn = next(p for p in client.get(reverse("products")).json() if p["slug"] == "vpn")
    assert vpn["min_price"]["price"] == "5.00"
    assert vpn["min_price"]["currency"] == "USD"
    assert vpn["min_price"]["period"] == "month"
    assert vpn["has_example_prices"] is True
    assert vpn["availability"] == "available"
    assert vpn["prices_updated_at"] is not None


def test_product_detail_localised(client, seeded):
    uk = client.get(reverse("product-detail", args=["selene"]), {"lang": "uk"}).json()
    en = client.get(reverse("product-detail", args=["selene"]), {"lang": "en"}).json()
    assert uk["tagline"].startswith("Парсер")
    assert en["tagline"].startswith("Parser")
    assert len(uk["plans"]) == 3
    assert uk["plans"][2]["price"] is None and uk["plans"][2]["period"] == "on_request"
    assert uk["plans"][0]["buy_url"].endswith("/selene/starter")
    assert len(uk["faq"]) == 2 and len(uk["features"]) == 6
    assert uk["seo"]["title"].startswith("MXXNLY Selene")


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
    priced = {p["slug"]: p for p in data["products"]}  # only products with plans
    assert {"vpn", "selene", "khonsu", "lunaflow"} <= set(priced)
    assert "haven" not in priced  # ad-funded portal, no plans
    # Khonsu prices are the real ones from khonsu.cc; every other price is an example.
    assert not any(plan["is_example"] for plan in priced["khonsu"]["plans"])
    assert all(
        plan["is_example"] for slug, p in priced.items() if slug != "khonsu" for plan in p["plans"]
    )


def test_site_content(client, seeded):
    data = client.get(reverse("site-content")).json()
    assert "support_sla" in data["settings"]
    assert data["testimonials"] == []  # none are visible by default


def test_site_content_team(client, seeded):
    assert client.get(reverse("site-content")).json()["team"] == []  # nobody added yet

    TeamMember.objects.create(
        name="Анна", role_uk="Дизайнерка", role_en="Designer", bio_uk="Малює", order=2
    )
    TeamMember.objects.create(name="Олег", role_uk="Розробник", order=1)
    TeamMember.objects.create(name="Прихований", role_uk="X", is_visible=False)

    uk = client.get(reverse("site-content"), {"lang": "uk"}).json()["team"]
    assert [m["name"] for m in uk] == ["Олег", "Анна"]  # ordered, hidden one excluded
    assert uk[1]["role"] == "Дизайнерка" and uk[1]["bio"] == "Малює" and uk[1]["photo"] == ""

    en = client.get(reverse("site-content"), {"lang": "en"}).json()["team"]
    assert en[0]["role"] == "Розробник"  # no English role: falls back to Ukrainian
    assert en[1]["role"] == "Designer"


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
        "product": "selene",
    }
    response = client.post(reverse("support"), payload, format="json")
    assert response.status_code == 201
    request = SupportRequest.objects.get()
    assert request.status == SupportRequest.Status.NEW
    assert request.product.slug == "selene"


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
    assert "/en/products/selene</loc>" in body
    assert "/uk/products/khonsu</loc>" in body
    Product.objects.create(
        name="Secret", slug="secret", tagline_uk="x", publish_status="published", is_private=True
    )
    assert "secret" not in client.get("/sitemap.xml").content.decode()
    assert 'hreflang="x-default"' in body


def test_health_ignores_allowed_hosts(client, settings):
    settings.ALLOWED_HOSTS = ["example.com"]
    response = client.get("/api/health/", HTTP_HOST="localhost:8000")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
