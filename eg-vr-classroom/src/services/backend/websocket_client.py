"""
WebSocket Real-Time Communication
For multi-user VR classrooms, parent monitoring, and live updates
"""

import logging
from typing import Callable, Dict, List, Optional, Any
from threading import Thread, Event
import time

import socketio

from src.core.config import config

logger = logging.getLogger(__name__)


class WebSocketError(Exception):
    """WebSocket error"""
    pass


class OASISWebSocket:
    """
    WebSocket client for OASIS Education Planet

    Features:
    - Real-time multi-user synchronization
    - Parent monitoring (shadow mode)
    - Live activity updates
    - Voice chat signaling
    - Emergency stop broadcasts
    """

    def __init__(self, base_url: Optional[str] = None):
        """
        Initialize WebSocket client

        Args:
            base_url: Backend URL (defaults to config)
        """
        service_config = config.get_service_config('backend')
        self.base_url = base_url or service_config.url

        self.sio = socketio.Client(
            reconnection=True,
            reconnection_attempts=5,
            reconnection_delay=1,
            reconnection_delay_max=5,
            logger=False,
            engineio_logger=False
        )

        self.connected = Event()
        self.token: Optional[str] = None
        self.user_id: Optional[int] = None
        self.user_type: Optional[str] = None

        # Event handlers storage
        self.event_handlers: Dict[str, List[Callable]] = {}

        # Set up core event listeners
        self._setup_core_listeners()

        logger.info(f"OASIS WebSocket client initialized: {self.base_url}")

    def _setup_core_listeners(self):
        """Set up core Socket.IO event listeners"""

        @self.sio.event
        def connect():
            """Handle connection"""
            logger.info("🌍 Connected to OASIS servers")
            self.connected.set()
            self._trigger_event('connected', {})

        @self.sio.event
        def disconnect():
            """Handle disconnection"""
            logger.info("🌍 Disconnected from OASIS servers")
            self.connected.clear()
            self._trigger_event('disconnected', {})

        @self.sio.event
        def connect_error(data):
            """Handle connection error"""
            logger.error(f"🌍 OASIS connection error: {data}")
            self._trigger_event('connection_error', data)

        # ====================================================================
        # PARENT MONITORING EVENTS
        # ====================================================================

        @self.sio.on('child_login')
        def on_child_login(data):
            """Child logged into VR"""
            logger.info(f"👶 Child login: {data.get('child_name')}")
            self._trigger_event('child_login', data)

        @self.sio.on('child_activity_started')
        def on_child_activity_started(data):
            """Child started an activity"""
            logger.info(f"🎮 Activity started: {data.get('activity_type')}")
            self._trigger_event('child_activity_started', data)

        @self.sio.on('child_activity_completed')
        def on_child_activity_completed(data):
            """Child completed an activity"""
            logger.info(f"✅ Activity completed: {data.get('accuracy')}% accuracy")
            self._trigger_event('child_activity_completed', data)

        @self.sio.on('learning_session_started')
        def on_learning_session_started(data):
            """Learning session started"""
            self._trigger_event('learning_session_started', data)

        @self.sio.on('learning_session_completed')
        def on_learning_session_completed(data):
            """Learning session completed"""
            self._trigger_event('learning_session_completed', data)

        @self.sio.on('progress_updated')
        def on_progress_updated(data):
            """Progress updated"""
            self._trigger_event('progress_updated', data)

        # ====================================================================
        # MULTI-USER VR EVENTS
        # ====================================================================

        @self.sio.on('student_joined_classroom')
        def on_student_joined(data):
            """Student joined VR classroom"""
            logger.info(f"👋 Student joined: {data.get('display_name')}")
            self._trigger_event('student_joined_classroom', data)

        @self.sio.on('student_left_classroom')
        def on_student_left(data):
            """Student left VR classroom"""
            logger.info(f"👋 Student left: {data.get('display_name')}")
            self._trigger_event('student_left_classroom', data)

        @self.sio.on('student_position_update')
        def on_position_update(data):
            """Student position/rotation update"""
            self._trigger_event('student_position_update', data)

        @self.sio.on('voice_chat_start')
        def on_voice_start(data):
            """Voice chat started"""
            self._trigger_event('voice_chat_start', data)

        @self.sio.on('voice_chat_end')
        def on_voice_end(data):
            """Voice chat ended"""
            self._trigger_event('voice_chat_end', data)

        @self.sio.on('approved_phrase_sent')
        def on_phrase_sent(data):
            """Approved phrase sent between students"""
            self._trigger_event('approved_phrase_sent', data)

        # ====================================================================
        # SAFETY & EMERGENCY EVENTS
        # ====================================================================

        @self.sio.on('emergency_stop')
        def on_emergency_stop(data):
            """Emergency stop triggered by parent"""
            logger.warning(f"🚨 EMERGENCY STOP: {data}")
            self._trigger_event('emergency_stop', data)

        @self.sio.on('parent_summon')
        def on_parent_summon(data):
            """Parent summoning child from VR"""
            logger.warning(f"👨‍👩‍👧 Parent summon: {data}")
            self._trigger_event('parent_summon', data)

        @self.sio.on('safety_alert')
        def on_safety_alert(data):
            """Safety system alert"""
            logger.warning(f"⚠️ Safety alert: {data.get('alert_type')}")
            self._trigger_event('safety_alert', data)

        # ====================================================================
        # VR WORLD EVENTS
        # ====================================================================

        @self.sio.on('blackboard_updated')
        def on_blackboard_update(data):
            """Shared blackboard updated"""
            self._trigger_event('blackboard_updated', data)

        @self.sio.on('landmark_changed')
        def on_landmark_changed(data):
            """Daily landmark mural changed"""
            logger.info(f"🗺️ New landmark: {data.get('landmark_name')}")
            self._trigger_event('landmark_changed', data)

        @self.sio.on('ai_character_speaking')
        def on_ai_character_speaking(data):
            """AI character (Al, Ella, Gus) speaking"""
            self._trigger_event('ai_character_speaking', data)

    def connect(self, token: str, user_type: str = 'child'):
        """
        Connect to OASIS WebSocket server

        Args:
            token: JWT authentication token
            user_type: 'parent' or 'child'
        """
        if self.sio.connected:
            logger.warning("Already connected to OASIS")
            return

        self.token = token
        self.user_type = user_type

        try:
            # Extract user_id from token
            from src.core.auth import jwt_manager
            payload = jwt_manager.verify_token(token)
            self.user_id = payload.get('user_id')

            # Connect with authentication
            self.sio.connect(
                self.base_url,
                auth={'token': token},
                transports=['websocket'],
                wait_timeout=10
            )

            # Wait for connection
            if self.connected.wait(timeout=10):
                logger.info(f"🌍 Connected to OASIS as {user_type} {self.user_id}")
            else:
                raise WebSocketError("Connection timeout")

        except Exception as e:
            logger.error(f"Failed to connect to OASIS: {e}")
            raise WebSocketError(f"Connection failed: {e}")

    def disconnect(self):
        """Disconnect from OASIS"""
        if self.sio.connected:
            self.sio.disconnect()
            logger.info("🌍 Disconnected from OASIS")

    def _trigger_event(self, event_name: str, data: Any):
        """Trigger registered event handlers"""
        handlers = self.event_handlers.get(event_name, [])
        for handler in handlers:
            try:
                handler(data)
            except Exception as e:
                logger.error(f"Event handler error ({event_name}): {e}")

    def on(self, event_name: str, handler: Callable):
        """
        Register event handler

        Args:
            event_name: Event name
            handler: Callback function

        Example:
            >>> ws = OASISWebSocket()
            >>> ws.on('child_login', lambda data: print(f"Child logged in: {data}"))
        """
        if event_name not in self.event_handlers:
            self.event_handlers[event_name] = []

        self.event_handlers[event_name].append(handler)
        logger.debug(f"Registered handler for event: {event_name}")

    def off(self, event_name: str, handler: Callable):
        """
        Unregister event handler

        Args:
            event_name: Event name
            handler: Callback function to remove
        """
        if event_name in self.event_handlers:
            try:
                self.event_handlers[event_name].remove(handler)
                logger.debug(f"Unregistered handler for event: {event_name}")
            except ValueError:
                pass

    # ========================================================================
    # PARENT ACTIONS
    # ========================================================================

    def join_parent_room(self, parent_id: int):
        """Join parent monitoring room"""
        if not self.sio.connected:
            raise WebSocketError("Not connected to OASIS")

        self.sio.emit('join_parent_room', {'parent_id': parent_id})
        logger.info(f"👨‍👩‍👧 Joined parent room: {parent_id}")

    def start_monitoring_child(self, child_id: int):
        """Start monitoring a child (shadow mode)"""
        if not self.sio.connected:
            raise WebSocketError("Not connected to OASIS")

        self.sio.emit('start_monitoring', {'child_id': child_id})
        logger.info(f"👁️ Started monitoring child: {child_id}")

    def stop_monitoring_child(self, child_id: int):
        """Stop monitoring a child"""
        if not self.sio.connected:
            raise WebSocketError("Not connected to OASIS")

        self.sio.emit('stop_monitoring', {'child_id': child_id})
        logger.info(f"👁️ Stopped monitoring child: {child_id}")

    def trigger_emergency_stop(self, child_id: int, reason: str = "Parent initiated"):
        """Trigger emergency stop for child's VR session"""
        if not self.sio.connected:
            raise WebSocketError("Not connected to OASIS")

        self.sio.emit('emergency_stop', {
            'child_id': child_id,
            'reason': reason
        })
        logger.warning(f"🚨 Emergency stop triggered for child {child_id}")

    def summon_child(self, child_id: int):
        """Summon child to exit VR (gentle)"""
        if not self.sio.connected:
            raise WebSocketError("Not connected to OASIS")

        self.sio.emit('parent_summon', {'child_id': child_id})
        logger.info(f"👨‍👩‍👧 Summoned child {child_id}")

    # ========================================================================
    # CHILD VR ACTIONS
    # ========================================================================

    def join_classroom(self, classroom_id: int, child_id: int):
        """Join a VR classroom"""
        if not self.sio.connected:
            raise WebSocketError("Not connected to OASIS")

        self.sio.emit('join_classroom', {
            'classroom_id': classroom_id,
            'child_id': child_id
        })
        logger.info(f"🏫 Joined classroom {classroom_id}")

    def leave_classroom(self, classroom_id: int, child_id: int):
        """Leave a VR classroom"""
        if not self.sio.connected:
            raise WebSocketError("Not connected to OASIS")

        self.sio.emit('leave_classroom', {
            'classroom_id': classroom_id,
            'child_id': child_id
        })
        logger.info(f"🏫 Left classroom {classroom_id}")

    def update_position(
        self,
        child_id: int,
        position: Dict[str, float],
        rotation: Dict[str, float]
    ):
        """
        Update student position in VR classroom

        Args:
            child_id: Child ID
            position: {x, y, z}
            rotation: {x, y, z, w} quaternion
        """
        if not self.sio.connected:
            return  # Silently skip if disconnected (performance)

        self.sio.emit('update_position', {
            'child_id': child_id,
            'position': position,
            'rotation': rotation,
            'timestamp': time.time()
        })

    def send_approved_phrase(
        self,
        from_child_id: int,
        to_child_id: int,
        phrase_id: int,
        phrase_text: str
    ):
        """
        Send approved phrase to another student

        Args:
            from_child_id: Sender child ID
            to_child_id: Recipient child ID
            phrase_id: Approved phrase ID
            phrase_text: Phrase text
        """
        if not self.sio.connected:
            raise WebSocketError("Not connected to OASIS")

        self.sio.emit('send_approved_phrase', {
            'from_child_id': from_child_id,
            'to_child_id': to_child_id,
            'phrase_id': phrase_id,
            'phrase_text': phrase_text
        })

    def report_safety_incident(
        self,
        child_id: int,
        incident_type: str,
        description: str
    ):
        """
        Report a safety incident

        Args:
            child_id: Child ID reporting
            incident_type: Type of incident
            description: Incident description
        """
        if not self.sio.connected:
            raise WebSocketError("Not connected to OASIS")

        self.sio.emit('report_safety_incident', {
            'child_id': child_id,
            'incident_type': incident_type,
            'description': description,
            'timestamp': time.time()
        })

        logger.warning(f"⚠️ Safety incident reported: {incident_type}")

    # ========================================================================
    # UTILITIES
    # ========================================================================

    def wait_for_connection(self, timeout: float = 10.0) -> bool:
        """
        Wait for connection to establish

        Args:
            timeout: Timeout in seconds

        Returns:
            True if connected within timeout
        """
        return self.connected.wait(timeout=timeout)

    def is_connected(self) -> bool:
        """Check if connected"""
        return self.sio.connected

    def get_connection_status(self) -> Dict[str, Any]:
        """Get connection status"""
        return {
            'connected': self.sio.connected,
            'user_id': self.user_id,
            'user_type': self.user_type,
            'base_url': self.base_url
        }


# Global instance
oasis_websocket = OASISWebSocket()
