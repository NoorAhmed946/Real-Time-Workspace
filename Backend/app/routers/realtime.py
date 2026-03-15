"""Realtime WebSocket endpoints for collaborative editing."""
from __future__ import annotations

import base64
import json
from typing import Dict, Set, Optional
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models import DocumentRole
from app.services.auth import auth_service
from app.services.document import document_service


router = APIRouter()
settings = get_settings()


# In-memory room tracking: document_id -> set of websockets
rooms: Dict[UUID, Set[WebSocket]] = {}


async def _authenticate_websocket(websocket: WebSocket) -> Optional[UUID]:
    """
    Extract and validate JWT from query params or headers for WebSocket connections.

    Returns:
        User ID (UUID) if the token is valid, otherwise None.
    """
    # Try query param ?token=<JWT>
    token = websocket.query_params.get("token")

    # Fallback to Authorization: Bearer <JWT> header
    if not token:
        auth_header = websocket.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.removeprefix("Bearer ").strip()

    if not token:
        return None

    payload = auth_service.decode_access_token(token)
    if payload is None:
        return None

    user_id_str = payload.get("sub")
    if not user_id_str:
        return None

    try:
        return UUID(user_id_str)
    except ValueError:
        return None


@router.websocket("/ws/documents/{document_id}")
async def document_realtime_ws(
    websocket: WebSocket,
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    WebSocket endpoint for realtime collaboration on a single document.

    Authentication:
        - Accepts JWT via ?token=<JWT> query parameter, or
        - Authorization: Bearer <JWT> header.

    Access control:
        - Requires at least VIEWER role on the target document.
        - Enforces WS_MAX_CONNECTIONS_PER_DOCUMENT per document.
    """
    # Accept connection so we can send close codes and reasons.
    await websocket.accept()

    # Authenticate user
    user_id = await _authenticate_websocket(websocket)
    if user_id is None:
        await websocket.close(code=4401, reason="Unauthorized")
        return

    # Check document access (VIEWER or higher)
    has_access = await document_service.check_access(
        db,
        document_id=document_id,
        user_id=user_id,
        required_role=DocumentRole.VIEWER,
    )
    if not has_access:
        await websocket.close(code=4403, reason="Forbidden")
        return

    # Enforce per-document connection limit
    room = rooms.setdefault(document_id, set())
    if len(room) >= settings.WS_MAX_CONNECTIONS_PER_DOCUMENT:
        await websocket.close(
            code=4409,
            reason="Too many connections for this document",
        )
        return

    room.add(websocket)

    try:
        # Send initial CRDT state
        result = await document_service.get_crdt_state(db, document_id)
        if result is None:
            crdt_state, version = None, 0
        else:
            crdt_state, version = result

        await websocket.send_text(
            json.dumps(
                {
                    "type": "init",
                    "document_id": str(document_id),
                    "version": version,
                    "state": base64.b64encode(crdt_state).decode()
                    if crdt_state
                    else None,
                }
            )
        )

        # Main receive loop
        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                # Ignore malformed messages
                continue

            message_type = message.get("type")

            if message_type == "update":
                # Client-side CRDT delta: forward to other collaborators.
                delta_b64 = message.get("delta")
                base_version = message.get("base_version")

                if not delta_b64 or base_version is None:
                    # Malformed message, ignore.
                    continue

                broadcast_payload = json.dumps(
                    {
                        "type": "update",
                        "document_id": str(document_id),
                        "delta": delta_b64,
                        "from_user_id": str(user_id),
                    }
                )

                # Broadcast to all other connections in the same room
                for ws in list(room):
                    if ws is websocket:
                        continue
                    await ws.send_text(broadcast_payload)

            elif message_type == "snapshot":
                # Full CRDT snapshot for persistence with optimistic locking.
                state_b64 = message.get("state")
                base_version = message.get("base_version")

                if not state_b64 or base_version is None:
                    continue

                try:
                    state_bytes = base64.b64decode(state_b64)
                except Exception:
                    continue

                updated_document = await document_service.update_crdt_state(
                    db,
                    document_id=document_id,
                    crdt_state=state_bytes,
                    expected_version=base_version,
                )

                if updated_document is None:
                    # Version conflict: inform client so it can reload latest state.
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "error",
                                "reason": "version_conflict",
                            }
                        )
                    )
                else:
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "snapshot_accepted",
                                "new_version": updated_document.crdt_version,
                            }
                        )
                    )

            # Additional message types (presence, cursors, etc.) can be added here.

    except WebSocketDisconnect:
        # Normal disconnect; just clean up the room below.
        pass
    finally:
        # Ensure we always remove the websocket from the room.
        room.discard(websocket)
        if not room:
            rooms.pop(document_id, None)

