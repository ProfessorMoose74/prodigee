"""
OASIS Service Manager
Central orchestrator for all OASIS Education Planet services

"Ready Player One's dream, realized for education"
"""

import logging
from typing import Dict, Optional, Any
from dataclasses import dataclass
from enum import Enum

from src.core.config import config
from src.core.auth import auth_service, jwt_manager
from src.core.database import db_manager

from src.services.backend import backend_client, oasis_websocket
from src.services.library import library_client
from src.services.translation import universal_translator

logger = logging.getLogger(__name__)


class ServiceStatus(Enum):
    """Service health status"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"
    UNKNOWN = "unknown"


@dataclass
class OASISStatus:
    """Overall OASIS system status"""
    database: ServiceStatus
    backend_api: ServiceStatus
    websocket: ServiceStatus
    library: ServiceStatus
    translation: ServiceStatus
    overall_health: ServiceStatus


class OASISServiceManager:
    """
    Central Service Manager for OASIS Education Planet

    Coordinates:
    - Authentication (parent/child login)
    - Database (PostgreSQL/SQLite)
    - Backend API (Flask - curriculum, progress)
    - WebSocket (real-time multi-user)
    - Library (content delivery)
    - Translation (universal translator)

    This is the command center that makes the OASIS come alive.
    """

    _instance = None

    def __new__(cls):
        """Singleton pattern"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize OASIS service manager"""
        if hasattr(self, '_initialized'):
            return

        logger.info("🌍 Initializing OASIS Education Planet Services...")

        # Core services
        self.auth = auth_service
        self.db = db_manager
        self.jwt = jwt_manager

        # External services
        self.backend = backend_client
        self.websocket = oasis_websocket
        self.library = library_client
        self.translator = universal_translator

        # Session management
        self.active_sessions: Dict[int, Dict[str, Any]] = {}

        self._initialized = True

        logger.info("🌍 OASIS Services initialized")

    # ========================================================================
    # STARTUP & HEALTH
    # ========================================================================

    def startup(self) -> bool:
        """
        Start all OASIS services

        Returns:
            True if startup successful
        """
        logger.info("🌍 Starting OASIS Education Planet...")

        try:
            # 1. Initialize database
            logger.info("  📊 Initializing database...")
            self.db.initialize()

            # 2. Test backend API connection
            logger.info("  🔌 Testing backend API...")
            if not self.backend.health_check():
                logger.warning("  ⚠️ Backend API unreachable (will retry)")

            # 3. Test library server
            logger.info("  📚 Testing library server...")
            if not self.library.health_check():
                logger.warning("  ⚠️ Library server unreachable (will retry)")

            # 4. Initialize translator
            logger.info("  🌐 Universal translator ready (30+ languages)")

            logger.info("🌍 ✅ OASIS Education Planet is ONLINE")
            return True

        except Exception as e:
            logger.error(f"🌍 ❌ OASIS startup failed: {e}")
            return False

    def shutdown(self):
        """Shutdown all OASIS services gracefully"""
        logger.info("🌍 Shutting down OASIS Education Planet...")

        # Close WebSocket connections
        if self.websocket.is_connected():
            self.websocket.disconnect()

        # Close database connections
        self.db.close_all()

        # Clear active sessions
        self.active_sessions.clear()

        logger.info("🌍 OASIS Education Planet shutdown complete")

    def health_check(self) -> OASISStatus:
        """
        Check health of all OASIS services

        Returns:
            OASISStatus with health of each service
        """
        # Check database
        try:
            db_healthy = self.db.test_connection()
            db_status = ServiceStatus.HEALTHY if db_healthy else ServiceStatus.DOWN
        except Exception:
            db_status = ServiceStatus.DOWN

        # Check backend API
        try:
            api_healthy = self.backend.health_check()
            api_status = ServiceStatus.HEALTHY if api_healthy else ServiceStatus.DOWN
        except Exception:
            api_status = ServiceStatus.DOWN

        # Check WebSocket
        ws_status = (ServiceStatus.HEALTHY if self.websocket.is_connected()
                    else ServiceStatus.DOWN)

        # Check library
        try:
            lib_healthy = self.library.health_check()
            lib_status = ServiceStatus.HEALTHY if lib_healthy else ServiceStatus.DOWN
        except Exception:
            lib_status = ServiceStatus.DOWN

        # Translation is local, always healthy
        trans_status = ServiceStatus.HEALTHY

        # Overall health
        statuses = [db_status, api_status, ws_status, lib_status, trans_status]
        healthy_count = sum(1 for s in statuses if s == ServiceStatus.HEALTHY)

        if healthy_count == len(statuses):
            overall = ServiceStatus.HEALTHY
        elif healthy_count >= 3:  # Core services working
            overall = ServiceStatus.DEGRADED
        else:
            overall = ServiceStatus.DOWN

        return OASISStatus(
            database=db_status,
            backend_api=api_status,
            websocket=ws_status,
            library=lib_status,
            translation=trans_status,
            overall_health=overall
        )

    # ========================================================================
    # CHILD SESSION MANAGEMENT (VR)
    # ========================================================================

    def start_child_vr_session(
        self,
        child_id: int,
        parent_token: str,
        vr_platform: str = 'openxr',
        headset_model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Start a child's VR session

        Complete flow:
        1. Authenticate child (COPPA-compliant)
        2. Create database session record
        3. Connect to WebSocket
        4. Join VR classroom
        5. Preload content

        Args:
            child_id: Child ID
            parent_token: Parent JWT token
            vr_platform: VR platform name
            headset_model: Headset model name

        Returns:
            {
                'session_id': int,
                'child_token': str,
                'classroom_id': int,
                'curriculum_week': int,
                'ready': bool
            }
        """
        logger.info(f"🎮 Starting VR session for child {child_id}")

        # 1. Authenticate child
        child_data, child_token = self.auth.login_child(child_id, parent_token)

        # 2. Create backend session
        session_response = self.backend.start_learning_session(
            session_type='vr_classroom',
            planned_duration=1800,  # 30 minutes
            activities_planned=3,
            token=child_token
        )

        session_id = session_response['session_id']

        # 3. Connect to WebSocket for real-time multi-user
        if not self.websocket.is_connected():
            self.websocket.connect(child_token, user_type='child')

        # 4. Assign to classroom (TODO: implement classroom assignment logic)
        classroom_id = 1  # For now, everyone joins classroom 1

        self.websocket.join_classroom(classroom_id, child_id)

        # 5. Get current curriculum week
        week_number = child_data.get('current_week', 1)

        # 6. Track active session
        self.active_sessions[child_id] = {
            'session_id': session_id,
            'child_token': child_token,
            'classroom_id': classroom_id,
            'week_number': week_number,
            'vr_platform': vr_platform,
            'headset_model': headset_model,
            'started_at': session_response.get('started_at')
        }

        logger.info(f"🎮 ✅ VR session {session_id} started for child {child_id}")

        return {
            'session_id': session_id,
            'child_token': child_token,
            'child_data': child_data,
            'classroom_id': classroom_id,
            'curriculum_week': week_number,
            'ready': True
        }

    def end_child_vr_session(
        self,
        child_id: int,
        accuracy: float,
        engagement: float,
        stars_earned: int
    ) -> bool:
        """
        End a child's VR session

        Args:
            child_id: Child ID
            accuracy: Overall accuracy percentage
            engagement: Engagement score (0-10)
            stars_earned: Total stars earned

        Returns:
            True if session ended successfully
        """
        if child_id not in self.active_sessions:
            logger.warning(f"No active session found for child {child_id}")
            return False

        session = self.active_sessions[child_id]

        logger.info(f"🎮 Ending VR session {session['session_id']} for child {child_id}")

        try:
            # 1. Complete backend session
            self.backend.complete_learning_session(
                session_id=session['session_id'],
                actual_duration=1800,  # TODO: calculate actual duration
                activities_completed=3,  # TODO: track actual activities
                overall_accuracy=accuracy,
                engagement_score=engagement,
                stars_earned=stars_earned,
                token=session['child_token']
            )

            # 2. Leave classroom
            self.websocket.leave_classroom(
                session['classroom_id'],
                child_id
            )

            # 3. Remove from active sessions
            del self.active_sessions[child_id]

            logger.info(f"🎮 ✅ VR session ended for child {child_id}")
            return True

        except Exception as e:
            logger.error(f"Error ending VR session: {e}")
            return False

    # ========================================================================
    # PARENT MONITORING
    # ========================================================================

    def start_parent_monitoring(
        self,
        parent_id: int,
        parent_token: str,
        child_id: int
    ) -> bool:
        """
        Start parent shadow mode monitoring

        Args:
            parent_id: Parent ID
            parent_token: Parent JWT token
            child_id: Child to monitor

        Returns:
            True if monitoring started
        """
        logger.info(f"👁️ Parent {parent_id} starting shadow mode for child {child_id}")

        # Connect parent to WebSocket if not already
        if not self.websocket.is_connected():
            self.websocket.connect(parent_token, user_type='parent')

        # Join parent room
        self.websocket.join_parent_room(parent_id)

        # Start monitoring child
        self.websocket.start_monitoring_child(child_id)

        return True

    # ========================================================================
    # CONTENT MANAGEMENT
    # ========================================================================

    def preload_classroom_content(
        self,
        era_theme: str = '1920s_american',
        token: Optional[str] = None
    ) -> int:
        """
        Preload all classroom 3D assets

        Args:
            era_theme: Classroom theme
            token: Auth token

        Returns:
            Number of assets preloaded
        """
        logger.info(f"📥 Preloading classroom content: {era_theme}")

        count = self.library.preload_classroom_assets(era_theme, token=token)

        logger.info(f"📥 ✅ Preloaded {count} classroom assets")
        return count

    def get_daily_landmark(
        self,
        country_code: Optional[str] = None,
        is_local: bool = False,
        token: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get daily landmark for lunchroom mural

        Args:
            country_code: Filter by country
            is_local: Whether to get local landmark
            token: Auth token

        Returns:
            Landmark metadata or None
        """
        landmarks = self.library.get_landmark_images(
            country_code=country_code,
            limit=1,
            token=token
        )

        return landmarks[0] if landmarks else None

    # ========================================================================
    # MULTI-LANGUAGE SUPPORT
    # ========================================================================

    def translate_for_child(
        self,
        text: str,
        child_language: str
    ) -> str:
        """
        Translate text to child's language

        Args:
            text: Text to translate
            child_language: Child's language code

        Returns:
            Translated text
        """
        if child_language == 'en':
            return text

        return self.translator.translate_text(text, 'en', child_language)

    def get_approved_phrases_for_child(
        self,
        child_language: str,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get approved communication phrases in child's language

        Args:
            child_language: Language code
            category: Filter by category

        Returns:
            List of translated phrases
        """
        return self.translator.get_approved_phrases_translated(
            child_language,
            category
        )

    # ========================================================================
    # UTILITIES
    # ========================================================================

    def get_system_status(self) -> Dict[str, Any]:
        """
        Get comprehensive system status

        Returns:
            {
                'health': OASISStatus,
                'active_sessions': int,
                'database_connection': bool,
                'services': {...}
            }
        """
        health = self.health_check()

        return {
            'health': {
                'database': health.database.value,
                'backend_api': health.backend_api.value,
                'websocket': health.websocket.value,
                'library': health.library.value,
                'translation': health.translation.value,
                'overall': health.overall_health.value
            },
            'active_sessions': len(self.active_sessions),
            'database_connection': health.database == ServiceStatus.HEALTHY,
            'websocket_connected': self.websocket.is_connected(),
            'services': {
                'backend_url': self.backend.base_url,
                'library_url': self.library.base_url,
                'languages_supported': len(self.translator.get_supported_languages())
            }
        }

    def __repr__(self) -> str:
        """String representation"""
        health = self.health_check()
        return f"<OASISServiceManager status={health.overall_health.value} sessions={len(self.active_sessions)}>"


# Global instance - The OASIS Command Center
oasis = OASISServiceManager()
