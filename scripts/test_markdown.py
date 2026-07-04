from markdown import save_article

content = """
# Redis Streams

## What is it?

Redis Streams is a data structure...

## Why it matters

Because...
"""

path = save_article(
    title="Redis Streams",
    category="backend",
    content=content,
)

print(path)