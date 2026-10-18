import pytest
from django.core.management import call_command
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

from apps.portfolio.models import ContactMessage, Project, Skill

pytestmark = pytest.mark.django_db


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.fixture
def seeded():
    call_command("seed_demo")


def test_portfolio_empty_database(client):
    response = client.get(reverse("portfolio"))

    assert response.status_code == 200
    data = response.json()
    assert data["profile"] is None
    assert data["projects"] == []
    assert data["skill_categories"] == []


def test_portfolio_returns_seeded_content(client, seeded):
    data = client.get(reverse("portfolio")).json()

    profile = data["profile"]
    assert profile["full_name"] == "Alex Moon"
    assert profile["brand"] == "alex"
    assert len(profile["roles"]) == 4
    assert len(profile["stats"]) == 4
    assert {link["platform"] for link in profile["socials"]} >= {"github", "telegram"}

    assert len(data["projects"]) == 6
    assert data["projects"][0]["technologies"]
    assert {c["slug"] for c in data["project_categories"]} == {"web", "bots", "open-source"}
    assert len(data["experience"]) == 4
    assert data["experience"][0]["end_date"] is None  # current position comes first
    assert data["featured_skills"]


def test_portfolio_hides_invisible_items(client, seeded):
    Project.objects.filter(category__slug="bots").update(is_visible=False)
    Skill.objects.filter(name="Python").update(is_visible=False)

    data = client.get(reverse("portfolio")).json()

    assert all(p["category"] != "bots" for p in data["projects"])
    assert "bots" not in {c["slug"] for c in data["project_categories"]}
    skill_names = {s["name"] for c in data["skill_categories"] for s in c["skills"]}
    assert "Python" not in skill_names


def test_uncategorized_skills_are_grouped(client):
    Skill.objects.create(name="Rust", level=2)

    data = client.get(reverse("portfolio")).json()

    assert data["skill_categories"][-1]["name"] == ""
    assert data["skill_categories"][-1]["skills"][0]["name"] == "Rust"


def test_contact_creates_message(client):
    payload = {
        "name": "Taras",
        "email": "taras@example.com",
        "subject": "Project",
        "message": "Hi! I would like to discuss a collaboration.",
    }
    response = client.post(
        reverse("contact"), payload, format="json", HTTP_X_FORWARDED_FOR="203.0.113.7"
    )

    assert response.status_code == 201
    message = ContactMessage.objects.get()
    assert message.email == "taras@example.com"
    assert message.ip_address == "203.0.113.7"
    assert message.is_read is False


def test_contact_validates_input(client):
    response = client.post(
        reverse("contact"), {"name": "A", "email": "nope", "message": "short"}, format="json"
    )

    assert response.status_code == 400
    assert {"name", "email", "message"} <= set(response.json())
    assert not ContactMessage.objects.exists()


def test_contact_honeypot_is_silently_dropped(client):
    payload = {
        "name": "Bot",
        "email": "bot@example.com",
        "message": "Buy cheap stuff right now!!!",
        "website": "http://spam.example",
    }
    response = client.post(reverse("contact"), payload, format="json")

    assert response.status_code == 201
    assert not ContactMessage.objects.exists()


def test_contact_is_throttled(client, monkeypatch):
    monkeypatch.setattr(ScopedRateThrottle, "THROTTLE_RATES", {"contact": "2/min"})
    payload = {"name": "Ann", "email": "ann@example.com", "message": "Hello there, friend!"}

    codes = [client.post(reverse("contact"), payload, format="json").status_code for _ in range(3)]

    assert codes == [201, 201, 429]


def test_health_ignores_allowed_hosts(client, settings):
    settings.ALLOWED_HOSTS = ["example.com"]

    response = client.get("/api/health/", HTTP_HOST="localhost:8000")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
