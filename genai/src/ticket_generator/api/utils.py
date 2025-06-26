import os

def get_auth_headers(token: str = None):
    """
    Returns the Authorization header with the JWT token.
    If token is provided, uses that token, otherwise falls back to environment variable.
    """
    if token:
        # If token is provided as parameter, use it directly
        if token.startswith("Bearer "):
            return {"Authorization": token}
        else:
            return {"Authorization": f"Bearer {token}"}
    else:
        # Fallback to environment variable for backward compatibility
        env_token = os.getenv("SERVICE_AUTH_TOKEN")
        if not env_token:
            raise RuntimeError("No authentication token provided and SERVICE_AUTH_TOKEN environment variable is not set")
        return {"Authorization": f"Bearer {env_token}"}

def extract_token_from_header(authorization_header: str) -> str:
    """
    Extract JWT token from Authorization header.
    Expected format: 'Bearer <token>'
    """
    if not authorization_header:
        raise ValueError("Authorization header is missing")
    
    if not authorization_header.startswith("Bearer "):
        raise ValueError("Authorization header must start with 'Bearer '")
    
    return authorization_header[7:]  # Remove "Bearer " prefix
