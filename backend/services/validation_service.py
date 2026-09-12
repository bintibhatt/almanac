"""
Article validation service for Almanac.
Validates article markdown structure, required sections, frontmatter metadata,
and code block formatting prior to publishing.
"""

from dataclasses import dataclass, field
import re
from typing import Dict, List, Optional


@dataclass
class ValidationResult:
    """Result container for article quality and structural validation."""
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    word_count: int = 0


class ValidationService:
    """
    Validates generated Markdown articles against Almanac structural standards.
    """

    REQUIRED_METADATA_FIELDS = [
        "title",
        "slug",
        "category",
        "tags",
        "difficulty",
        "readingTime",
        "published",
        "source",
        "provider",
        "model",
    ]

    RECOMMENDED_SECTIONS = [
        "TL;DR",
        "Problem",
        "Core Concept",
        "How It Works",
        "Architecture",
        "Example",
        "Common Pitfalls",
        "Interview Questions",
    ]

    def __init__(self, min_word_count: int = 100):
        self.min_word_count = min_word_count

    def validate(
        self,
        body_content: str,
        metadata: Dict[str, str],
        strict: bool = False,
    ) -> ValidationResult:
        """
        Validate article body content and metadata.
        """
        errors: List[str] = []
        warnings: List[str] = []

        # 1. Non-empty check
        cleaned_body = body_content.strip()
        if not cleaned_body:
            errors.append("Article body content is empty.")
            return ValidationResult(is_valid=False, errors=errors, warnings=warnings, word_count=0)

        # 2. Word count check
        words = re.findall(r"\w+", cleaned_body)
        word_count = len(words)
        if word_count < self.min_word_count:
            msg = f"Article word count ({word_count}) is below minimum threshold ({self.min_word_count})."
            if strict:
                errors.append(msg)
            else:
                warnings.append(msg)

        # 3. Metadata validation
        for meta_field in self.REQUIRED_METADATA_FIELDS:
            if not metadata.get(meta_field):
                errors.append(f"Missing required metadata field: '{meta_field}'.")

        # 4. Duplicate H1 Header Check
        first_line = cleaned_body.splitlines()[0].strip() if cleaned_body else ""
        if first_line.startswith("# ") and not first_line.startswith("## "):
            errors.append("Article body contains a top-level H1 header ('# Title'). Use H2 ('## Section') instead.")

        # 5. Code Block Balance Check
        fences = re.findall(r"^```", cleaned_body, flags=re.MULTILINE)
        if len(fences) % 2 != 0:
            errors.append(f"Unbalanced code block fences detected ({len(fences)} ``` tags).")

        # 6. Recommended Sections Check
        matched_sections = 0
        for section in self.RECOMMENDED_SECTIONS:
            pattern = re.compile(rf"^##\s+.*{re.escape(section)}.*$", re.MULTILINE | re.IGNORECASE)
            if pattern.search(cleaned_body):
                matched_sections += 1

        if matched_sections < 3:
            warnings.append(
                f"Article contains only {matched_sections} standard sections. Recommended sections include TL;DR, Core Concept, How It Works, Architecture, Example."
            )

        is_valid = len(errors) == 0
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            word_count=word_count,
        )
