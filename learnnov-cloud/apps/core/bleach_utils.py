import bleach

ALLOWED_TAGS = [
    'b', 'i', 'strong', 'em', 'a', 'p', 'ul', 'ol', 'li',
    'br', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre', 'code'
]
ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title', 'target'],
    'span': ['class', 'style'],
    'div': ['class', 'style'],
    '*': ['id', 'class']
}
ALLOWED_STYLES = [
    'color', 'background-color', 'font-size', 'font-weight', 'text-align'
]

def sanitize_html(html_content):
    if not html_content:
        return html_content
    return bleach.clean(
        html_content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        styles=ALLOWED_STYLES,
        strip=True
    )
