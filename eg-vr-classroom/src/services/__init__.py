"""
OASIS Education Planet - Service Integration Layer

All services needed to run the educational universe
"""

from .backend import (
    EGBackendClient,
    backend_client,
    OASISWebSocket,
    oasis_websocket
)
from .library import (
    LibraryClient,
    library_client
)
from .translation import (
    UniversalTranslator,
    universal_translator
)
from .oasis_service_manager import (
    OASISServiceManager,
    oasis,
    OASISStatus,
    ServiceStatus
)

__all__ = [
    # Backend
    'EGBackendClient',
    'backend_client',
    'OASISWebSocket',
    'oasis_websocket',

    # Library
    'LibraryClient',
    'library_client',

    # Translation
    'UniversalTranslator',
    'universal_translator',

    # OASIS Master Control
    'OASISServiceManager',
    'oasis',
    'OASISStatus',
    'ServiceStatus',
]
