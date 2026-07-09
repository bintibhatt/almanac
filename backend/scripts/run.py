"""
Main entry point for Almanac.
"""

import json
import random

from config import TOPICS_FILE
from writer import generate_article
from markdown import save_article
from git_utils import commit_and_push


def load_topics():
    """Load topics from topics.json"""

    with open(TOPICS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    topics = load_topics()

    topic = random.choice(topics)

    print(f"\n🚀 Generating article on '{topic['title']}'...\n")

    article = generate_article(topic["title"])

    path = save_article(
        title=topic["title"],
        category=topic["category"],
        content=article,
    )

    print(f"📄 Saved article to:\n{path}")

    commit_message = (
        f"docs({topic['category']}): add note on {topic['title']}"
    )

    commit_and_push(path, commit_message)


if __name__ == "__main__":
    main()

# """
# Main entry point for almanac.
# """

# import json
# import random

# from config import TOPICS_FILE
# from writer import generate_article
# from markdown import save_article


# def load_topics():
#     with open(TOPICS_FILE, "r", encoding="utf-8") as f:
#         data = f.read().strip()

#     if not data:
#         raise ValueError("topics.json is empty.")

#     return json.loads(data)


# def main():
#     topics = load_topics()

#     topic = random.choice(topics)

#     print(f"\nGenerating article on: {topic['title']}...\n")

#     article = generate_article(topic["title"])

#     path = save_article(
#         title=topic["title"],
#         category=topic["category"],
#         content=article,
#     )

#     print(f"✅ Saved article to:\n{path}")


# if __name__ == "__main__":
#     main()