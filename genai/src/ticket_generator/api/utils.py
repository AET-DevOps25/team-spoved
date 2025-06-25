import os

def get_auth_headers():
    """
    Returns the Authorization header with the JWT token for service-to-service authentication.
    The token should be set in the SERVICE_AUTH_TOKEN environment variable.
    """
    token = os.getenv("SERVICE_AUTH_TOKEN")
    if not token:
        raise RuntimeError("SERVICE_AUTH_TOKEN environment variable is not set")
    return {"Authorization": f"Bearer {token}"}
