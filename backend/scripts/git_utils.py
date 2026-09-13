"""
Git utilities for Almanac.
Responsible for safely committing and pushing generated articles.
Supports GitPython with an automatic fallback to the system git CLI.
"""

from pathlib import Path
import subprocess
import sys


def _commit_via_cli(repo_path: Path, filepath: Path, message: str) -> bool:
    """Fallback git commit using system git binary via subprocess."""
    try:
        # Check if git is available
        check = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        if check.returncode != 0:
            print("ℹ️ Git is not initialized or safe.directory is missing. Skipping commit.")
            return False

        # Stage file
        add_res = subprocess.run(
            ["git", "add", str(filepath)],
            cwd=repo_path,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        if add_res.returncode != 0:
            return False

        # Commit
        commit_res = subprocess.run(
            ["git", "commit", "-m", message],
            cwd=repo_path,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        if commit_res.returncode == 0:
            print(f"✅ Git commit created: {message}")
            return True
        elif "nothing to commit" in commit_res.stdout or "nothing to commit" in commit_res.stderr:
            print("ℹ️ No git changes detected.")
            return False

        return False
    except Exception as err:
        print(f"⚠️ CLI Git automation encountered an error: {err}")
        return False


def commit_and_push(filepath: Path, message: str) -> bool:
    """
    Commit the generated file and push it to GitHub if available.
    Returns True if committed, False if skipped or no changes detected.
    """
    repo_path = Path(__file__).resolve().parents[2]

    try:
        from git import Repo, InvalidGitRepositoryError, NoSuchPathError

        try:
            repo = Repo(repo_path)
        except (InvalidGitRepositoryError, NoSuchPathError):
            return _commit_via_cli(repo_path, filepath, message)

        repo.git.add(str(filepath))
        if not repo.is_dirty(untracked_files=True):
            print("ℹ️ No git changes detected.")
            return False

        repo.index.commit(message)
        print(f"✅ Git commit created: {message}")

        if "origin" in repo.remotes:
            try:
                origin = repo.remote("origin")
                origin.push()
                print("📤 Pushed to GitHub (origin)")
            except Exception as push_err:
                print(f"⚠️ Git push skipped: {push_err}")
        else:
            print("ℹ️ No remote 'origin' configured. Commit saved locally.")

        return True

    except ImportError:
        # Fallback to system git CLI
        return _commit_via_cli(repo_path, filepath, message)
    except Exception as err:
        print(f"⚠️ Git automation encountered an error: {err}")
        return False