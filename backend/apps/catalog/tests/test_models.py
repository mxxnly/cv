from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from apps.catalog.models import (
    Plan,
    PriceHistory,
    Product,
    SiteSettings,
    split_lines,
    split_paragraphs,
)

pytestmark = pytest.mark.django_db


def test_split_helpers():
    assert split_lines(" - one\n• two\n\nthree ") == ["one", "two", "three"]
    assert split_paragraphs("a\nb\n\n\nc") == ["a\nb", "c"]


def test_product_slug_is_generated_and_unique():
    first = Product.objects.create(name="MXXNLY Invoice", tagline_uk="x")
    second = Product.objects.create(name="MXXNLY Invoice", tagline_uk="y")
    assert first.slug == "invoice"
    assert second.slug == "invoice-2"


def test_price_change_is_recorded_and_updates_product_timestamp():
    product = Product.objects.create(name="MXXNLY VPN", tagline_uk="x")
    plan = Plan.objects.create(product=product, name="Basic", price=Decimal("5"), currency="USD")
    assert PriceHistory.objects.count() == 1  # creation is the first entry
    first_stamp = Product.objects.get(pk=product.pk).prices_updated_at
    assert first_stamp is not None

    plan.name = "Basic+"
    plan.save()
    assert PriceHistory.objects.count() == 1  # no price change, no entry

    plan.price = Decimal("6")
    plan.save()
    history = PriceHistory.objects.order_by("-changed_at").first()
    assert (history.old_price, history.new_price) == (Decimal("5"), Decimal("6"))
    assert Product.objects.get(pk=product.pk).prices_updated_at >= first_stamp


def test_plan_requires_price_unless_on_request():
    product = Product.objects.create(name="X", tagline_uk="x")
    plan = Plan(product=product, name="Custom", period=Plan.Period.MONTH)
    with pytest.raises(ValidationError):
        plan.full_clean()
    plan.period = Plan.Period.ON_REQUEST
    plan.full_clean()


def test_localized_falls_back_to_ukrainian():
    product = Product.objects.create(name="X", tagline_uk="Укр", tagline_en="")
    assert product.localized("tagline", "en") == "Укр"
    assert product.localized("tagline", "xx") == "Укр"


def test_site_settings_singleton():
    a = SiteSettings.load()
    b = SiteSettings.load()
    assert a.pk == b.pk == 1
    with pytest.raises(ValidationError):
        a.delete()
