"""Backend service integration"""

from .client import EGBackendClient, backend_client, BackendAPIError
from .websocket_client import OASISWebSocket, oasis_websocket, WebSocketError

__all__ = [
    'EGBackendClient',
    'backend_client',
    'BackendAPIError',
    'OASISWebSocket',
    'oasis_websocket',
    'WebSocketError',
]
