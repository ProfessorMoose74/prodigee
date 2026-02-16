"""
WebSocket Communication Hub
Handles real-time communication for VR classroom sessions
"""

import asyncio
import json
import uuid
from typing import Dict, List, Optional, Any, Set, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from datetime import datetime
import websockets
from websockets.server import WebSocketServerProtocol
import ssl

logger = logging.getLogger(__name__)


class MessageType(Enum):
    """WebSocket message types"""
    # Authentication
    AUTH_REQUEST = "auth_request"
    AUTH_SUCCESS = "auth_success"
    AUTH_FAILED = "auth_failed"
    
    # Session Management
    JOIN_CLASSROOM = "join_classroom"
    LEAVE_CLASSROOM = "leave_classroom"
    SESSION_STATE = "session_state"
    
    # Real-time Updates
    USER_JOINED = "user_joined"
    USER_LEFT = "user_left"
    USER_UPDATE = "user_update"
    
    # VR Interactions
    AVATAR_UPDATE = "avatar_update"
    VOICE_DATA = "voice_data"
    GESTURE_DATA = "gesture_data"
    INTERACTION = "interaction"
    
    # Educational Content
    LESSON_UPDATE = "lesson_update"
    PROGRESS_UPDATE = "progress_update"
    EXERCISE_RESULT = "exercise_result"
    
    # Safety & Moderation
    SAFETY_ALERT = "safety_alert"
    PARENT_NOTIFICATION = "parent_notification"
    EMERGENCY_END = "emergency_end"
    
    # Translation
    TRANSLATION_REQUEST = "translation_request"
    TRANSLATION_RESPONSE = "translation_response"
    
    # System
    HEARTBEAT = "heartbeat"
    ERROR = "error"
    NOTIFICATION = "notification"


@dataclass
class WebSocketMessage:
    """Structured WebSocket message"""
    message_id: str
    message_type: MessageType
    sender_id: str
    classroom_id: Optional[str]
    timestamp: datetime
    data: Dict[str, Any]
    requires_auth: bool = True


@dataclass
class ConnectedClient:
    """Connected WebSocket client"""
    client_id: str
    websocket: WebSocketServerProtocol
    user_id: Optional[str]
    account_type: Optional[str]
    parent_id: Optional[str]
    classroom_id: Optional[str]
    platform: str
    connected_at: datetime
    last_heartbeat: datetime
    is_authenticated: bool
    permissions: List[str]


class WebSocketHub:
    """
    Central hub for WebSocket communication in VR classroom
    Handles real-time messaging, authentication, and safety monitoring
    """
    
    def __init__(self, auth_bridge, session_manager, language_service):
        self.auth_bridge = auth_bridge
        self.session_manager = session_manager
        self.language_service = language_service
        
        # Client management
        self.connected_clients: Dict[str, ConnectedClient] = {}
        self.classroom_clients: Dict[str, Set[str]] = {}  # classroom_id -> client_ids
        self.parent_observers: Dict[str, Set[str]] = {}   # parent_id -> client_ids
        
        # Message handling
        self.message_handlers: Dict[MessageType, Callable] = {}
        self.message_queue: asyncio.Queue = asyncio.Queue()
        
        # Security
        self.rate_limits: Dict[str, List[datetime]] = {}
        self.max_messages_per_minute = 60
        self.max_voice_data_per_second = 10
        
        # Safety monitoring
        self.safety_monitors: List[Callable] = []
        self.blocked_clients: Set[str] = set()
        
        self._register_message_handlers()
    
    def _register_message_handlers(self):
        """Register message type handlers"""
        self.message_handlers = {
            MessageType.AUTH_REQUEST: self._handle_auth_request,
            MessageType.JOIN_CLASSROOM: self._handle_join_classroom,
            MessageType.LEAVE_CLASSROOM: self._handle_leave_classroom,
            MessageType.AVATAR_UPDATE: self._handle_avatar_update,
            MessageType.VOICE_DATA: self._handle_voice_data,
            MessageType.GESTURE_DATA: self._handle_gesture_data,
            MessageType.INTERACTION: self._handle_interaction,
            MessageType.LESSON_UPDATE: self._handle_lesson_update,
            MessageType.PROGRESS_UPDATE: self._handle_progress_update,
            MessageType.TRANSLATION_REQUEST: self._handle_translation_request,
            MessageType.HEARTBEAT: self._handle_heartbeat,
            MessageType.EMERGENCY_END: self._handle_emergency_end
        }
    
    async def start_server(self, host: str = "localhost", port: int = 8765,
                          ssl_context: Optional[ssl.SSLContext] = None):
        """Start WebSocket server"""
        logger.info(f"Starting WebSocket server on {host}:{port}")
        
        async def client_handler(websocket, path):
            await self._handle_client_connection(websocket, path)
        
        # Start message processing task
        asyncio.create_task(self._process_message_queue())
        
        # Start server
        if ssl_context:
            await websockets.serve(client_handler, host, port, ssl=ssl_context)
        else:
            await websockets.serve(client_handler, host, port)
        
        logger.info("WebSocket server started")
    
    async def _handle_client_connection(self, websocket: WebSocketServerProtocol, path: str):
        """Handle new client connection"""
        client_id = str(uuid.uuid4())
        
        client = ConnectedClient(
            client_id=client_id,
            websocket=websocket,
            user_id=None,
            account_type=None,
            parent_id=None,
            classroom_id=None,
            platform="unknown",
            connected_at=datetime.utcnow(),
            last_heartbeat=datetime.utcnow(),
            is_authenticated=False,
            permissions=[]
        )
        
        self.connected_clients[client_id] = client
        
        logger.info(f"Client {client_id} connected from {websocket.remote_address}")
        
        try:
            async for message in websocket:
                await self._process_client_message(client_id, message)
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client {client_id} disconnected")
        except Exception as e:
            logger.error(f"Error handling client {client_id}: {e}")
        finally:
            await self._cleanup_client(client_id)
    
    async def _process_client_message(self, client_id: str, raw_message: str):
        """Process incoming client message"""
        try:
            # Parse message
            message_data = json.loads(raw_message)
            
            # Rate limiting
            if not await self._check_rate_limit(client_id):
                await self._send_error(client_id, "Rate limit exceeded")
                return
            
            # Create structured message
            message = WebSocketMessage(
                message_id=message_data.get("message_id", str(uuid.uuid4())),
                message_type=MessageType(message_data["type"]),
                sender_id=client_id,
                classroom_id=message_data.get("classroom_id"),
                timestamp=datetime.utcnow(),
                data=message_data.get("data", {}),
                requires_auth=message_data.get("requires_auth", True)
            )
            
            # Check authentication if required
            client = self.connected_clients[client_id]
            if message.requires_auth and not client.is_authenticated:
                if message.message_type != MessageType.AUTH_REQUEST:
                    await self._send_error(client_id, "Authentication required")
                    return
            
            # Add to queue for processing
            await self.message_queue.put((client_id, message))
            
        except Exception as e:
            logger.error(f"Failed to process message from {client_id}: {e}")
            await self._send_error(client_id, "Invalid message format")
    
    async def _check_rate_limit(self, client_id: str) -> bool:
        """Check if client is within rate limits"""
        now = datetime.utcnow()
        
        if client_id not in self.rate_limits:
            self.rate_limits[client_id] = []
        
        # Clean old timestamps
        minute_ago = now.timestamp() - 60
        self.rate_limits[client_id] = [
            ts for ts in self.rate_limits[client_id] 
            if ts.timestamp() > minute_ago
        ]
        
        # Check limit
        if len(self.rate_limits[client_id]) >= self.max_messages_per_minute:
            return False
        
        self.rate_limits[client_id].append(now)
        return True
    
    async def _process_message_queue(self):
        """Process messages from queue"""
        while True:
            try:
                client_id, message = await self.message_queue.get()
                
                # Check if client is blocked
                if client_id in self.blocked_clients:
                    continue
                
                # Get handler
                handler = self.message_handlers.get(message.message_type)
                if handler:
                    await handler(client_id, message)
                else:
                    logger.warning(f"No handler for message type: {message.message_type}")
                
                # Safety monitoring
                await self._monitor_message_safety(client_id, message)
                
            except Exception as e:
                logger.error(f"Error processing message: {e}")
    
    async def _handle_auth_request(self, client_id: str, message: WebSocketMessage):
        """Handle authentication request"""
        token = message.data.get("token")
        if not token:
            await self._send_auth_failed(client_id, "Missing token")
            return
        
        # Verify token
        user_info = await self.auth_bridge.verify_session_token(token)
        if not user_info:
            await self._send_auth_failed(client_id, "Invalid token")
            return
        
        # Update client info
        client = self.connected_clients[client_id]
        client.user_id = user_info["user_id"]
        client.account_type = user_info["account_type"]
        client.parent_id = user_info.get("parent_id")
        client.platform = message.data.get("platform", "unknown")
        client.permissions = user_info["permissions"]
        client.is_authenticated = True
        
        # Send success response
        await self._send_message(client_id, MessageType.AUTH_SUCCESS, {
            "user_id": client.user_id,
            "account_type": client.account_type,
            "permissions": client.permissions
        })
        
        logger.info(f"Client {client_id} authenticated as {client.user_id}")
    
    async def _send_auth_failed(self, client_id: str, reason: str):
        """Send authentication failed message"""
        await self._send_message(client_id, MessageType.AUTH_FAILED, {"reason": reason})
    
    async def _handle_join_classroom(self, client_id: str, message: WebSocketMessage):
        """Handle classroom join request"""
        classroom_id = message.data.get("classroom_id")
        if not classroom_id:
            await self._send_error(client_id, "Missing classroom_id")
            return
        
        client = self.connected_clients[client_id]
        
        # Add client to classroom
        if classroom_id not in self.classroom_clients:
            self.classroom_clients[classroom_id] = set()
        
        self.classroom_clients[classroom_id].add(client_id)
        client.classroom_id = classroom_id
        
        # Notify other participants
        await self._broadcast_to_classroom(classroom_id, MessageType.USER_JOINED, {
            "user_id": client.user_id,
            "account_type": client.account_type,
            "platform": client.platform
        }, exclude_client=client_id)
        
        logger.info(f"Client {client_id} joined classroom {classroom_id}")
    
    async def _handle_leave_classroom(self, client_id: str, message: WebSocketMessage):
        """Handle classroom leave request"""
        client = self.connected_clients[client_id]
        classroom_id = client.classroom_id
        
        if classroom_id:
            await self._remove_client_from_classroom(client_id, classroom_id)
    
    async def _remove_client_from_classroom(self, client_id: str, classroom_id: str):
        """Remove client from classroom"""
        client = self.connected_clients[client_id]
        
        # Remove from classroom
        if classroom_id in self.classroom_clients:
            self.classroom_clients[classroom_id].discard(client_id)
            if not self.classroom_clients[classroom_id]:
                del self.classroom_clients[classroom_id]
        
        client.classroom_id = None
        
        # Notify other participants
        await self._broadcast_to_classroom(classroom_id, MessageType.USER_LEFT, {
            "user_id": client.user_id
        })
        
        logger.info(f"Client {client_id} left classroom {classroom_id}")
    
    async def _handle_avatar_update(self, client_id: str, message: WebSocketMessage):
        """Handle avatar state update"""
        client = self.connected_clients[client_id]
        
        if not client.classroom_id:
            return
        
        # Broadcast avatar update to classroom
        await self._broadcast_to_classroom(
            client.classroom_id, 
            MessageType.AVATAR_UPDATE,
            {
                "user_id": client.user_id,
                "avatar_data": message.data
            },
            exclude_client=client_id
        )
    
    async def _handle_voice_data(self, client_id: str, message: WebSocketMessage):
        """Handle voice data transmission"""
        client = self.connected_clients[client_id]
        
        # Safety check - verify voice belongs to child
        if client.account_type == "child":
            audio_data = message.data.get("audio_data")
            if audio_data:
                is_child_voice = await self.language_service.verify_child_voice(
                    audio_data.encode() if isinstance(audio_data, str) else audio_data,
                    client.user_id
                )
                
                if not is_child_voice:
                    await self._trigger_safety_alert(client_id, "adult_voice_detected")
                    return
        
        # Translate if needed
        if message.data.get("translate", False):
            await self._handle_voice_translation(client_id, message)
        else:
            # Broadcast voice data to classroom
            await self._broadcast_to_classroom(
                client.classroom_id,
                MessageType.VOICE_DATA,
                {
                    "user_id": client.user_id,
                    "audio_data": message.data.get("audio_data"),
                    "language": message.data.get("language", "en")
                },
                exclude_client=client_id
            )
    
    async def _handle_voice_translation(self, client_id: str, message: WebSocketMessage):
        """Handle voice translation request"""
        client = self.connected_clients[client_id]
        audio_data = message.data.get("audio_data")
        source_lang = message.data.get("source_language", "en")
        
        if not audio_data or not client.classroom_id:
            return
        
        # Get target languages from classroom participants
        target_languages = await self._get_classroom_languages(client.classroom_id)
        target_languages = [lang for lang in target_languages if lang != source_lang]
        
        if not target_languages:
            return
        
        # Translate voice
        from src.core.language.recognition import LanguageCode
        try:
            source_enum = LanguageCode(source_lang)
            target_enums = [LanguageCode(lang) for lang in target_languages]
            
            translations = await self.language_service.translate_voice(
                audio_data.encode() if isinstance(audio_data, str) else audio_data,
                source_enum,
                target_enums
            )
            
            # Send translated audio to appropriate clients
            for lang_code, translated_audio in translations.items():
                await self._send_translated_voice(
                    client.classroom_id,
                    client.user_id,
                    lang_code,
                    translated_audio
                )
                
        except ValueError as e:
            logger.error(f"Invalid language code: {e}")
    
    async def _get_classroom_languages(self, classroom_id: str) -> List[str]:
        """Get languages used by classroom participants"""
        languages = set()
        
        if classroom_id in self.classroom_clients:
            for client_id in self.classroom_clients[classroom_id]:
                client = self.connected_clients.get(client_id)
                if client and client.user_id:
                    # Get user's language preference
                    # This would integrate with user preferences
                    languages.add("en")  # Default for now
        
        return list(languages)
    
    async def _send_translated_voice(self, classroom_id: str, sender_id: str,
                                   language: str, audio_data: bytes):
        """Send translated voice to appropriate clients"""
        # Send to clients who need this language
        if classroom_id in self.classroom_clients:
            for client_id in self.classroom_clients[classroom_id]:
                client = self.connected_clients.get(client_id)
                if client and client.user_id != sender_id:
                    # Check if client needs this language
                    # This would check user's language preference
                    await self._send_message(client_id, MessageType.VOICE_DATA, {
                        "user_id": sender_id,
                        "audio_data": audio_data.decode() if isinstance(audio_data, bytes) else audio_data,
                        "language": language,
                        "translated": True
                    })
    
    async def _handle_gesture_data(self, client_id: str, message: WebSocketMessage):
        """Handle gesture data"""
        client = self.connected_clients[client_id]
        
        if not client.classroom_id:
            return
        
        # Broadcast gesture to classroom
        await self._broadcast_to_classroom(
            client.classroom_id,
            MessageType.GESTURE_DATA,
            {
                "user_id": client.user_id,
                "gesture": message.data.get("gesture"),
                "confidence": message.data.get("confidence", 1.0)
            },
            exclude_client=client_id
        )
    
    async def _handle_interaction(self, client_id: str, message: WebSocketMessage):
        """Handle VR interaction"""
        client = self.connected_clients[client_id]
        
        # Log interaction for safety monitoring
        interaction_data = {
            "user_id": client.user_id,
            "interaction_type": message.data.get("type"),
            "target": message.data.get("target"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Broadcast to classroom if appropriate
        if message.data.get("broadcast", False) and client.classroom_id:
            await self._broadcast_to_classroom(
                client.classroom_id,
                MessageType.INTERACTION,
                interaction_data,
                exclude_client=client_id
            )
    
    async def _handle_lesson_update(self, client_id: str, message: WebSocketMessage):
        """Handle lesson content update"""
        client = self.connected_clients[client_id]
        
        # Only teachers can send lesson updates
        if client.account_type != "teacher":
            await self._send_error(client_id, "Insufficient permissions")
            return
        
        if client.classroom_id:
            await self._broadcast_to_classroom(
                client.classroom_id,
                MessageType.LESSON_UPDATE,
                message.data
            )
    
    async def _handle_progress_update(self, client_id: str, message: WebSocketMessage):
        """Handle learning progress update"""
        client = self.connected_clients[client_id]
        
        # Update session manager
        if client.user_id:
            await self.session_manager.update_user_activity(
                client_id, 
                {"learning_progress": message.data}
            )
        
        # Notify parents if child
        if client.account_type == "child" and client.parent_id:
            await self._notify_parent(client.parent_id, MessageType.PROGRESS_UPDATE, {
                "child_id": client.user_id,
                "progress": message.data
            })
    
    async def _handle_translation_request(self, client_id: str, message: WebSocketMessage):
        """Handle text translation request"""
        text = message.data.get("text")
        source_lang = message.data.get("source_language", "en")
        target_lang = message.data.get("target_language", "en")
        
        if not text:
            return
        
        from src.core.language.recognition import LanguageCode
        try:
            source_enum = LanguageCode(source_lang)
            target_enums = [LanguageCode(target_lang)]
            
            translations = await self.language_service.translate_text(
                text, source_enum, target_enums, "classroom"
            )
            
            await self._send_message(client_id, MessageType.TRANSLATION_RESPONSE, {
                "original_text": text,
                "source_language": source_lang,
                "translations": translations
            })
            
        except ValueError as e:
            logger.error(f"Translation error: {e}")
    
    async def _handle_heartbeat(self, client_id: str, message: WebSocketMessage):
        """Handle heartbeat message"""
        client = self.connected_clients[client_id]
        client.last_heartbeat = datetime.utcnow()
    
    async def _handle_emergency_end(self, client_id: str, message: WebSocketMessage):
        """Handle emergency session end"""
        client = self.connected_clients[client_id]
        
        # Only parents can trigger emergency end
        if client.account_type != "parent":
            await self._send_error(client_id, "Insufficient permissions")
            return
        
        child_id = message.data.get("child_id")
        if child_id:
            # End child's session
            success = await self.auth_bridge.emergency_end_child_session(
                message.data.get("parent_token"), child_id
            )
            
            if success:
                # Disconnect child client
                child_client_id = self._find_client_by_user_id(child_id)
                if child_client_id:
                    await self._disconnect_client(child_client_id, "Emergency end by parent")
                
                logger.warning(f"Emergency session end for child {child_id} by parent {client.user_id}")
    
    def _find_client_by_user_id(self, user_id: str) -> Optional[str]:
        """Find client ID by user ID"""
        for client_id, client in self.connected_clients.items():
            if client.user_id == user_id:
                return client_id
        return None
    
    async def _disconnect_client(self, client_id: str, reason: str = "Disconnected"):
        """Forcefully disconnect a client"""
        if client_id in self.connected_clients:
            client = self.connected_clients[client_id]
            try:
                await client.websocket.close(reason=reason)
            except:
                pass
            await self._cleanup_client(client_id)
    
    async def _trigger_safety_alert(self, client_id: str, alert_type: str):
        """Trigger safety alert"""
        client = self.connected_clients[client_id]
        
        alert_data = {
            "alert_type": alert_type,
            "user_id": client.user_id,
            "classroom_id": client.classroom_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Log security incident
        logger.warning(f"Security alert: {alert_type} for user {client.user_id}")
        
        # Notify moderators
        await self._notify_moderators(MessageType.SAFETY_ALERT, alert_data)
        
        # Notify parent if child account
        if client.account_type == "child" and client.parent_id:
            await self._notify_parent(client.parent_id, MessageType.SAFETY_ALERT, alert_data)
        
        # Block client if severe
        if alert_type in ["adult_voice_detected", "inappropriate_behavior"]:
            self.blocked_clients.add(client_id)
            await self._disconnect_client(client_id, f"Safety violation: {alert_type}")
    
    async def _notify_parent(self, parent_id: str, message_type: MessageType, data: Dict):
        """Send notification to parent"""
        parent_client_id = self._find_client_by_user_id(parent_id)
        if parent_client_id:
            await self._send_message(parent_client_id, MessageType.PARENT_NOTIFICATION, {
                "notification_type": message_type.value,
                "data": data
            })
    
    async def _notify_moderators(self, message_type: MessageType, data: Dict):
        """Send notification to all moderators"""
        for client_id, client in self.connected_clients.items():
            if client.account_type == "moderator":
                await self._send_message(client_id, message_type, data)
    
    async def _monitor_message_safety(self, client_id: str, message: WebSocketMessage):
        """Monitor message for safety issues"""
        client = self.connected_clients[client_id]
        
        # Run safety monitors
        for monitor in self.safety_monitors:
            try:
                await monitor(client, message)
            except Exception as e:
                logger.error(f"Safety monitor error: {e}")
    
    async def _broadcast_to_classroom(self, classroom_id: str, message_type: MessageType,
                                    data: Dict, exclude_client: Optional[str] = None):
        """Broadcast message to all clients in classroom"""
        if classroom_id not in self.classroom_clients:
            return
        
        for client_id in self.classroom_clients[classroom_id]:
            if client_id != exclude_client:
                await self._send_message(client_id, message_type, data)
    
    async def _send_message(self, client_id: str, message_type: MessageType, data: Dict):
        """Send message to specific client"""
        if client_id not in self.connected_clients:
            return
        
        client = self.connected_clients[client_id]
        
        message = {
            "message_id": str(uuid.uuid4()),
            "type": message_type.value,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
        
        try:
            await client.websocket.send(json.dumps(message))
        except Exception as e:
            logger.error(f"Failed to send message to {client_id}: {e}")
            await self._cleanup_client(client_id)
    
    async def _send_error(self, client_id: str, error_message: str):
        """Send error message to client"""
        await self._send_message(client_id, MessageType.ERROR, {
            "error": error_message
        })
    
    async def _cleanup_client(self, client_id: str):
        """Clean up client connection"""
        if client_id not in self.connected_clients:
            return
        
        client = self.connected_clients[client_id]
        
        # Remove from classroom
        if client.classroom_id:
            await self._remove_client_from_classroom(client_id, client.classroom_id)
        
        # Remove from connected clients
        del self.connected_clients[client_id]
        
        # Clean up rate limiting
        if client_id in self.rate_limits:
            del self.rate_limits[client_id]
        
        # Remove from blocked list
        self.blocked_clients.discard(client_id)
        
        logger.info(f"Cleaned up client {client_id}")
    
    async def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        stats = {
            "total_connections": len(self.connected_clients),
            "authenticated_connections": sum(1 for c in self.connected_clients.values() if c.is_authenticated),
            "active_classrooms": len(self.classroom_clients),
            "blocked_clients": len(self.blocked_clients),
            "connections_by_type": {},
            "connections_by_platform": {}
        }
        
        # Count by account type
        for client in self.connected_clients.values():
            if client.account_type:
                stats["connections_by_type"][client.account_type] = \
                    stats["connections_by_type"].get(client.account_type, 0) + 1
            
            stats["connections_by_platform"][client.platform] = \
                stats["connections_by_platform"].get(client.platform, 0) + 1
        
        return stats