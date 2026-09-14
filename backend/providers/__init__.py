"""
Topic Providers package for Almanac.
"""

from .base import Topic, TopicProvider, slugify
from .github_provider import GitHubProvider
from .hackernews_provider import HackerNewsProvider
from .manual_provider import ManualProvider

__all__ = [
    "Topic",
    "TopicProvider",
    "slugify",
    "GitHubProvider",
    "HackerNewsProvider",
    "ManualProvider",
]
