import re
from typing import Optional


class LogSanitizer:
    """
    Sanitizes runtime error logs, stack traces, and request payloads
    to ensure zero credentials, tokens, API keys, or sensitive customer PII
    are ever transmitted to external LLM providers or logged insecurely.
    """

    PATTERNS = [
        # Bearer tokens & JWTs
        (re.compile(r'(Bearer\s+)[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*', re.IGNORECASE), r'\1[REDACTED_JWT_TOKEN]'),
        (re.compile(r'eyJ[A-Za-z0-9\-_=]{10,}\.[A-Za-z0-9\-_=]{10,}\.?[A-Za-z0-9\-_.+/=]*'), r'[REDACTED_JWT_TOKEN]'),

        # API Keys & Secrets
        (re.compile(r'(api[_\-]?key["\']?\s*[:=]\s*["\']?)([\w\-]{8,})(["\']?)', re.IGNORECASE), r'\1[REDACTED_API_KEY]\3'),
        (re.compile(r'(authorization["\']?\s*[:=]\s*["\']?Bearer\s+)([\w\-.]+)(["\']?)', re.IGNORECASE), r'\1[REDACTED_AUTH_TOKEN]\3'),
        (re.compile(r'(client[_\-]?secret["\']?\s*[:=]\s*["\']?)([\w\-]{8,})(["\']?)', re.IGNORECASE), r'\1[REDACTED_CLIENT_SECRET]\3'),
        (re.compile(r'(password["\']?\s*[:=]\s*["\']?)([^"\'\s,]+)(["\']?)', re.IGNORECASE), r'\1[REDACTED_PASSWORD]\3'),
        (re.compile(r'sk\-[a-zA-Z0-9]{20,}', re.IGNORECASE), r'[REDACTED_SECRET_KEY]'),
        (re.compile(r'AIza[0-9A-Za-z\-_]{35}', re.IGNORECASE), r'[REDACTED_GEMINI_KEY]'),

        # Credit Cards
        (re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b'), r'[REDACTED_CARD_NUMBER]'),

        # Email addresses
        (re.compile(r'\b[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b'), r'[USER_EMAIL]@\1'),
    ]

    @classmethod
    def sanitize(cls, text: Optional[str]) -> str:
        if not text:
            return ""
        sanitized = text
        for pattern, replacement in cls.PATTERNS:
            sanitized = pattern.sub(replacement, sanitized)
        return sanitized
