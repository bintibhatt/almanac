"""
Git utilities for Almanac.
Responsible for committing and pushing generated articles.
"""

from pathlib import Path
from git import Repo


def commit_and_push(filepath: Path, message: str):
    """Commit the generated file and push it to GitHub."""

    repo = Repo(Path(__file__).resolve().parents[2])

    # Stage the generated file
    repo.git.add(str(filepath))

    # Nothing changed
    if not repo.is_dirty(untracked_files=True):
        print("⚠️ No changes detected.")
        return

    # Commit
    repo.index.commit(message)

    # Push
    origin = repo.remote("origin")
    origin.push()

    print(f"✅ Git commit created")
    print(f"📤 Pushed to GitHub")