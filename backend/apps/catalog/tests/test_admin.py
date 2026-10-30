import pytest
from django.apps import apps
from django.core.management import call_command
from django.urls import reverse

from apps.catalog.models import ContactMessage, SiteSettings

pytestmark = pytest.mark.django_db

CATALOG_MODELS = [
    model
    for model in apps.get_app_config("catalog").get_models()
    if model.__name__ not in {"SiteSettings", "ProductLink", "ProductFAQ"}  # inline-only
]


@pytest.fixture
def admin_client(client, django_user_model):
    user = django_user_model.objects.create_superuser("admin", "admin@example.com", "pass12345")
    client.force_login(user)
    return client


@pytest.fixture
def seeded():
    call_command("seed_demo", "--publish")


def test_admin_index_is_branded(admin_client):
    response = admin_client.get(reverse("admin:index"))
    assert response.status_code == 200
    assert "MXXNLY Labs" in response.content.decode()


@pytest.mark.parametrize("model", CATALOG_MODELS, ids=lambda m: m.__name__)
def test_changelists_render(admin_client, seeded, model):
    url = reverse(f"admin:catalog_{model._meta.model_name}_changelist")
    assert admin_client.get(url).status_code == 200


@pytest.mark.parametrize("model", CATALOG_MODELS, ids=lambda m: m.__name__)
def test_change_pages_render(admin_client, seeded, model):
    if model is ContactMessage:
        ContactMessage.objects.create(
            name="Олена", email="olena@example.com", message="Привіт з тестів"
        )
    obj = model.objects.first()
    if obj is None:
        pytest.skip("no seeded rows")
    url = reverse(f"admin:catalog_{model._meta.model_name}_change", args=[obj.pk])
    assert admin_client.get(url).status_code == 200


def test_site_settings_changelist_redirects_to_singleton(admin_client):
    response = admin_client.get(reverse("admin:catalog_sitesettings_changelist"))
    assert response.status_code == 302
    assert response.url.endswith(f"/{SiteSettings.load().pk}/change/")
    assert admin_client.get(response.url).status_code == 200


def test_opening_a_message_marks_it_read(admin_client):
    message = ContactMessage.objects.create(
        name="Олена", email="olena@example.com", message="Привіт з тестів"
    )
    admin_client.get(reverse("admin:catalog_contactmessage_change", args=[message.pk]))
    message.refresh_from_db()
    assert message.is_read is True


def test_seed_defaults_to_drafts():
    call_command("seed_demo")
    from apps.catalog.models import Plan, Product

    assert not Product.objects.filter(publish_status=Product.PublishStatus.PUBLISHED).exists()
    assert not Plan.objects.filter(is_published=True).exists()
    # Khonsu carries the real prices from khonsu.cc; everything else is an example.
    assert not Plan.objects.filter(is_example=False).exclude(product__slug="khonsu").exists()
    assert Plan.objects.filter(product__slug="khonsu", is_example=False).count() == 5
