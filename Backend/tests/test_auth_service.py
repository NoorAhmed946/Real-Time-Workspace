import time
from uuid import uuid4

from app.services.auth import auth_service


def test_hash_token_is_deterministic_and_not_plaintext():
    token = "sample-refresh-token"
    hashed1 = auth_service.hash_token(token)
    hashed2 = auth_service.hash_token(token)

    assert hashed1 == hashed2
    assert hashed1 != token


def test_create_and_decode_access_token_roundtrip():
    user_id = uuid4()

    token, expires_at = auth_service.create_access_token(user_id)

    assert isinstance(token, str)
    assert expires_at is not None

    payload = auth_service.decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == str(user_id)
    assert payload.get("type") == "access"


def test_decode_access_token_returns_none_for_invalid_token():
    invalid_token = "not-a-real-jwt"
    payload = auth_service.decode_access_token(invalid_token)
    assert payload is None

