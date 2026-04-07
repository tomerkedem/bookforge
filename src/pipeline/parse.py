"""
Splits raw paragraphs into chapters based on headings.
Returns a list of chapters with title and content.
"""


def parse(ingested: dict) -> list[dict]:
    paragraphs = ingested["paragraphs"]
    chapters = []
    current = None

    for para in paragraphs:
        style = para["style"]
        text = para["text"]

        if "Heading 1" in style:
            if current:
                chapters.append(current)
            current = {
                "number": len(chapters) + 1,
                "title": text,
                "content": [],
                "has_images": False
            }
        elif current:
            current["content"].append({
                "text": text,
                "style": style
            })

    if current:
        chapters.append(current)

    return chapters


def to_markdown(chapter: dict) -> str:
    lines = [f"# {chapter['title']}", ""]

    for item in chapter["content"]:
        style = item["style"]
        text = item["text"]

        if "Heading 2" in style:
            lines.append(f"## {text}")
        elif "Heading 3" in style:
            lines.append(f"### {text}")
        elif "List" in style:
            lines.append(f"- {text}")
        else:
            lines.append(text)

        lines.append("")

    return "\n".join(lines)