"""A single integer in the cache that changes whenever catalog content changes.

Every cached API response and every ETag includes this version, so admin edits are visible
immediately without clearing caches by hand.
"""

from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

VERSION_KEY = "catalog:version"


def catalog_version() -> int:
    return cache.get_or_set(VERSION_KEY, 1, None)


def bump_catalog_version() -> None:
    try:
        cache.incr(VERSION_KEY)
    except ValueError:  # key missing (cache cleared): start a new epoch
        cache.set(VERSION_KEY, 2, None)


def connect_signals(models: tuple) -> None:
    for model in models:

        @receiver(post_save, sender=model, weak=False)
        def _saved(sender, **kwargs):
            bump_catalog_version()

        @receiver(post_delete, sender=model, weak=False)
        def _deleted(sender, **kwargs):
            bump_catalog_version()
