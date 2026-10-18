import pytest
from django.apps import apps
from django.contrib import admin
from django.core.management import call_command
from django.urls import reverse

from apps.portfolio.models import ContactMessage, Profile

pytestmark = pytest.mark.django_db

PORTFOLIO_MODELS = [
    model
    for model in apps.get_app_config("portfolio").get_models()
    if admin.site.is_registered(model)
]


@pytest.fixture
def admin_client(client, django_user_model):
    user = django_user_model.objects.create_superuser("admin", "admin@example.com", "pass12345")
    client.force_login(user)
    call_command("seed_demo")
    return client


def _url(model, view: str, *args) -> str:
    return reverse(f"admin:{model._meta.app_label}_{model._meta.model_name}_{view}", args=args)


def test_dashboard(admin_client):
    assert admin_client.get(reverse("admin:index")).status_code == 200


@pytest.mark.parametrize("model", PORTFOLIO_MODELS, ids=lambda m: m.__name__)
def test_changelist_and_change_pages(admin_client, model):
    response = admin_client.get(_url(model, "changelist"), follow=True)
    assert response.status_code == 200

    obj = model.objects.first()
    if obj is not None:
        assert admin_client.get(_url(model, "change", obj.pk)).status_code == 200


@pytest.mark.parametrize("model", PORTFOLIO_MODELS, ids=lambda m: m.__name__)
def test_add_pages(admin_client, model):
    expected = 403 if model in (Profile, ContactMessage) else 200
    assert admin_client.get(_url(model, "add")).status_code == expected


def test_profile_changelist_redirects_to_singleton(admin_client):
    response = admin_client.get(_url(Profile, "changelist"))
    assert response.status_code == 302
    assert response.url == _url(Profile, "change", 1)


def test_opening_message_marks_it_read(admin_client):
    message = ContactMessage.objects.create(
        name="Olena", email="olena@example.com", message="Hello from the test suite"
    )

    admin_client.get(_url(ContactMessage, "change", message.pk))

    message.refresh_from_db()
    assert message.is_read is True
