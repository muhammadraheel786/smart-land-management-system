"""
Enhanced security utilities for production deployment.
"""
import hashlib
import secrets
import re
from typing import Optional


def generate_secret_key(length: int = 50) -> str:
    """Generate a cryptographically secure secret key."""
    return secrets.token_urlsafe(length)


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """
    Hash a password with SHA-256 and a salt.
    Returns (hashed_password, salt).
    """
    if salt is None:
        salt = secrets.token_hex(32)
    
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000  # iterations
    )
    return pwd_hash.hex(), salt


def verify_password(password: str, hashed: str, salt: str) -> bool:
    """Verify a password against its hash."""
    pwd_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(pwd_hash, hashed)


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength.
    Returns (is_valid, error_message).
    """
    if len(password) < 12:
        return False, "Password must be at least 12 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, ""


def sanitize_input(text: str, max_length: int = 1000) -> str:
    """Sanitize user input to prevent injection attacks."""
    # Remove null bytes
    text = text.replace('\x00', '')
    
    # Limit length
    text = text[:max_length]
    
    # Remove control characters except newlines and tabs
    text = ''.join(char for char in text if char.isprintable() or char in '\n\t')
    
    return text.strip()


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def generate_csrf_token() -> str:
    """Generate a CSRF token."""
    return secrets.token_urlsafe(32)


# Rate limiting helper
class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self, max_attempts: int = 5, window_seconds: int = 60):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.attempts: dict[str, list[float]] = {}
    
    def is_allowed(self, identifier: str, current_time: float) -> bool:
        """Check if an action is allowed for the given identifier."""
        if identifier not in self.attempts:
            self.attempts[identifier] = []
        
        # Remove old attempts outside the window
        self.attempts[identifier] = [
            t for t in self.attempts[identifier]
            if current_time - t < self.window_seconds
        ]
        
        # Check if limit exceeded
        if len(self.attempts[identifier]) >= self.max_attempts:
            return False
        
        # Record this attempt
        self.attempts[identifier].append(current_time)
        return True
    
    def reset(self, identifier: str):
        """Reset attempts for an identifier."""
        if identifier in self.attempts:
            del self.attempts[identifier]
