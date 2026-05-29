import re
import bleach
from bleach.css_sanitizer import CSSSanitizer

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
    # Remove script tags and all their content completely
    html_content = re.sub(r'<script\b[^>]*>([\s\S]*?)<\/script>', '', html_content, flags=re.IGNORECASE)
    # Remove style tags and all their content completely
    html_content = re.sub(r'<style\b[^>]*>([\s\S]*?)<\/style>', '', html_content, flags=re.IGNORECASE)
    
    css_sanitizer = CSSSanitizer(allowed_css_properties=ALLOWED_STYLES)
    return bleach.clean(
        html_content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        css_sanitizer=css_sanitizer,
        strip=True
    )
