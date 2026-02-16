"""
Session Management System
Handles VR classroom sessions, synchronization, and safety monitoring
"""

import asyncio
import json
import uuid
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from datetime import datetime, timedelta
import hashlib

logger = logging.getLogger(__name__)


class SessionState(Enum):
    """VR session states"""
    INITIALIZING = "initializing"
    ACTIVE = "active"
    PAUSED = "paused"
    SUSPENDED = "suspended"
    ENDING = "ending"
    ENDED = "ended"


class UserRole(Enum):
    """User roles in the classroom"""
    STUDENT = "student"
    TEACHER = "teacher"
    PARENT_OBSERVER = "parent_observer"
    MODERATOR = "moderator"


@dataclass
class UserSession:
    """Individual user session data"""
    session_id: str
    user_id: str
    parent_id: Optional[str]
    display_name: str
    role: UserRole
    age_range: Optional[str]
    platform: str
    language: str
    location_data: Dict
    avatar_id: Optional[str]
    voice_verified: bool
    joined_at: datetime
    last_activity: datetime
    is_active: bool
    safety_flags: List[str]
    learning_progress: Dict


@dataclass
class ClassroomSession:
    """Classroom session data"""
    classroom_id: str
    session_id: str
    teacher_id: str
    subject: str
    lesson_id: Optional[str]
    max_students: int
    created_at: datetime
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    state: SessionState
    participants: Dict[str, UserSession]
    safety_incidents: List[Dict]
    lesson_data: Dict
    settings: Dict


class SessionManager:
    """
    Manages VR classroom sessions and real-time synchronization
    """
    
    def __init__(self, helyxium_connector, language_service, location_service):
        self.helyxium = helyxium_connector
        self.language_service = language_service
        self.location_service = location_service
        
        self.active_sessions: Dict[str, ClassroomSession] = {}
        self.user_sessions: Dict[str, UserSession] = {}
        self.parent_observers: Dict[str, Set[str]] = {}  # parent_id -> {session_ids}
        
        self.session_timeout = 3600  # 1 hour
        self.max_students_per_classroom = 25
        self.safety_monitoring_enabled = True
        
    async def create_classroom_session(self, teacher_id: str, subject: str,
                                     lesson_id: Optional[str] = None,
                                     max_students: int = 20) -> str:
        """Create a new classroom session"""
        classroom_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())
        
        session = ClassroomSession(
            classroom_id=classroom_id,
            session_id=session_id,
            teacher_id=teacher_id,
            subject=subject,
            lesson_id=lesson_id,
            max_students=min(max_students, self.max_students_per_classroom),
            created_at=datetime.utcnow(),
            started_at=None,
            ended_at=None,
            state=SessionState.INITIALIZING,
            participants={},
            safety_incidents=[],
            lesson_data={},
            settings=self._get_default_classroom_settings()
        )
        
        self.active_sessions[classroom_id] = session
        
        logger.info(f"Created classroom session {classroom_id} for teacher {teacher_id}")
        return classroom_id
    
    def _get_default_classroom_settings(self) -> Dict:
        """Get default classroom settings"""
        return {
            "voice_chat_enabled": True,
            "hand_raising_enabled": True,
            "collaborative_board": True,
            "parent_observation_allowed": True,
            "recording_enabled": False,
            "language_auto_translate": True,
            "safety_mode": "strict",
            "content_filter_level": "child_safe"
        }
    
    async def join_classroom(self, classroom_id: str, user_id: str, 
                           parent_token: str, platform: str) -> Optional[UserSession]:
        """Join a user to a classroom session"""
        if classroom_id not in self.active_sessions:
            logger.error(f"Classroom {classroom_id} not found")
            return None
        
        classroom = self.active_sessions[classroom_id]
        
        # Check if classroom is full
        student_count = sum(1 for p in classroom.participants.values() 
                          if p.role == UserRole.STUDENT)
        if student_count >= classroom.max_students:
            logger.warning(f"Classroom {classroom_id} is full")
            return None
        
        # Verify parent authorization
        parent_id = await self._verify_parent_token(parent_token)
        if not parent_id:
            logger.warning(f"Invalid parent token for user {user_id}")
            return None
        
        # Get user location and language
        location_data = await self.location_service.get_user_location(user_id, classroom_id)
        language = location_data.language_codes[0] if location_data.language_codes else "en"
        
        # Create user session
        user_session = UserSession(
            session_id=str(uuid.uuid4()),
            user_id=user_id,
            parent_id=parent_id,
            display_name=await self._get_safe_display_name(user_id),
            role=UserRole.STUDENT,
            age_range=await self._get_user_age_range(user_id),
            platform=platform,
            language=language,
            location_data=asdict(location_data),
            avatar_id=None,
            voice_verified=False,
            joined_at=datetime.utcnow(),
            last_activity=datetime.utcnow(),
            is_active=True,
            safety_flags=[],
            learning_progress={}
        )
        
        # Add to classroom and user tracking
        classroom.participants[user_id] = user_session
        self.user_sessions[user_session.session_id] = user_session
        
        # Start session in Helyxium
        helyxium_session = await self.helyxium.create_session(
            user_id, 
            self._platform_string_to_enum(platform),
            parent_token
        )
        
        if helyxium_session:
            await self.helyxium.join_classroom(helyxium_session.session_id, classroom_id)
        
        # Start the classroom if this is the first student
        if classroom.state == SessionState.INITIALIZING and len(classroom.participants) > 0:
            await self._start_classroom_session(classroom_id)
        
        logger.info(f"User {user_id} joined classroom {classroom_id}")
        
        # Notify other participants
        await self._broadcast_user_joined(classroom_id, user_session)
        
        return user_session
    
    async def _verify_parent_token(self, token: str) -> Optional[str]:
        """Verify parent authorization token"""
        # In production, this would validate against parent authentication system
        # For now, decode a simple token
        try:
            # Simple base64 decode for demo (use proper JWT in production)
            import base64
            decoded = base64.b64decode(token).decode('utf-8')
            parent_data = json.loads(decoded)
            return parent_data.get('parent_id')
        except:
            return None
    
    async def _get_safe_display_name(self, user_id: str) -> str:
        """Generate safe display name for child (no real names)"""
        # Generate anonymous but consistent display names
        hash_object = hashlib.md5(user_id.encode())
        hash_hex = hash_object.hexdigest()
        
        # Use hash to select from safe name lists
        first_names = ["Student", "Learner", "Explorer", "Thinker", "Creator", "Builder"]
        colors = ["Blue", "Red", "Green", "Yellow", "Purple", "Orange", "Pink", "Cyan"]
        
        first_idx = int(hash_hex[:2], 16) % len(first_names)
        color_idx = int(hash_hex[2:4], 16) % len(colors)
        
        return f"{colors[color_idx]} {first_names[first_idx]}"
    
    async def _get_user_age_range(self, user_id: str) -> str:
        """Get user age range from parent account"""
        # This would query the parent/child database
        return "8-10"  # Default
    
    def _platform_string_to_enum(self, platform: str):
        """Convert platform string to Helyxium enum"""
        from src.core.helyxium.connector import VRPlatform
        platform_map = {
            "meta_quest": VRPlatform.META_QUEST,
            "steam_vr": VRPlatform.STEAM_VR,
            "psvr": VRPlatform.PSVR,
            "vrchat": VRPlatform.VRCHAT,
            "desktop": VRPlatform.DESKTOP
        }
        return platform_map.get(platform, VRPlatform.DESKTOP)
    
    async def _start_classroom_session(self, classroom_id: str):
        """Start the classroom session"""
        classroom = self.active_sessions[classroom_id]
        classroom.state = SessionState.ACTIVE
        classroom.started_at = datetime.utcnow()
        
        # Initialize classroom environment
        await self._initialize_classroom_environment(classroom_id)
        
        logger.info(f"Started classroom session {classroom_id}")
    
    async def _initialize_classroom_environment(self, classroom_id: str):
        """Initialize the VR classroom environment"""
        classroom = self.active_sessions[classroom_id]
        
        # Set up localized content for each participant
        for user_session in classroom.participants.values():
            location_data = user_session.location_data
            # Apply localization based on user's location
            # This would update the VR environment
        
        # Load lesson content if specified
        if classroom.lesson_id:
            await self._load_lesson_content(classroom_id, classroom.lesson_id)
    
    async def _load_lesson_content(self, classroom_id: str, lesson_id: str):
        """Load Elemental Genius lesson content"""
        # This would integrate with Elemental Genius curriculum API
        lesson_data = {
            "lesson_id": lesson_id,
            "activities": [],
            "resources": []
        }
        
        self.active_sessions[classroom_id].lesson_data = lesson_data
    
    async def add_parent_observer(self, classroom_id: str, parent_id: str,
                                 child_user_id: str) -> bool:
        """Add parent as silent observer to child's classroom"""
        if classroom_id not in self.active_sessions:
            return False
        
        classroom = self.active_sessions[classroom_id]
        
        # Verify parent is authorized for this child
        child_session = next(
            (s for s in classroom.participants.values() 
             if s.user_id == child_user_id and s.parent_id == parent_id),
            None
        )
        
        if not child_session:
            logger.warning(f"Parent {parent_id} not authorized for child {child_user_id}")
            return False
        
        # Create observer session
        observer_session = UserSession(
            session_id=str(uuid.uuid4()),
            user_id=f"parent_{parent_id}",
            parent_id=parent_id,
            display_name="Parent Observer",
            role=UserRole.PARENT_OBSERVER,
            age_range=None,
            platform="desktop",  # Parents typically observe from desktop
            language=child_session.language,
            location_data=child_session.location_data,
            avatar_id=None,
            voice_verified=True,
            joined_at=datetime.utcnow(),
            last_activity=datetime.utcnow(),
            is_active=True,
            safety_flags=[],
            learning_progress={}
        )
        
        classroom.participants[f"parent_{parent_id}"] = observer_session
        
        # Track parent observers
        if parent_id not in self.parent_observers:
            self.parent_observers[parent_id] = set()
        self.parent_observers[parent_id].add(classroom_id)
        
        logger.info(f"Added parent observer {parent_id} to classroom {classroom_id}")
        return True
    
    async def update_user_activity(self, session_id: str, activity_data: Dict):
        """Update user activity and check for safety concerns"""
        if session_id not in self.user_sessions:
            return
        
        user_session = self.user_sessions[session_id]
        user_session.last_activity = datetime.utcnow()
        
        # Safety monitoring
        if self.safety_monitoring_enabled:
            await self._monitor_user_safety(user_session, activity_data)
        
        # Update learning progress if relevant
        if 'learning_progress' in activity_data:
            user_session.learning_progress.update(activity_data['learning_progress'])
    
    async def _monitor_user_safety(self, user_session: UserSession, activity_data: Dict):
        """Monitor user activity for safety concerns"""
        safety_flags = []
        
        # Voice verification check
        if 'voice_data' in activity_data:
            is_child = await self.language_service.verify_child_voice(
                activity_data['voice_data'], 
                user_session.user_id
            )
            
            if not is_child and user_session.role == UserRole.STUDENT:
                safety_flags.append("adult_voice_detected")
        
        # Behavioral analysis
        if 'behavior_anomaly' in activity_data:
            safety_flags.append("behavior_anomaly")
        
        # Update safety flags
        user_session.safety_flags.extend(safety_flags)
        
        # Alert if safety concerns
        if safety_flags:
            await self._handle_safety_incident(user_session, safety_flags)
    
    async def _handle_safety_incident(self, user_session: UserSession, flags: List[str]):
        """Handle safety incident"""
        incident = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_session.user_id,
            "session_id": user_session.session_id,
            "flags": flags,
            "severity": "high" if "adult_voice_detected" in flags else "medium"
        }
        
        # Find classroom
        classroom_id = None
        for cid, classroom in self.active_sessions.items():
            if user_session.user_id in classroom.participants:
                classroom_id = cid
                break
        
        if classroom_id:
            self.active_sessions[classroom_id].safety_incidents.append(incident)
        
        # Immediate response for severe incidents
        if incident["severity"] == "high":
            await self._emergency_response(user_session, incident)
        
        # Notify parents
        if user_session.parent_id:
            await self._notify_parent_of_incident(user_session.parent_id, incident)
        
        logger.warning(f"Safety incident: {incident}")
    
    async def _emergency_response(self, user_session: UserSession, incident: Dict):
        """Emergency response for severe safety incidents"""
        # Suspend user session
        user_session.is_active = False
        
        # Remove from classroom
        await self.leave_classroom(user_session.session_id)
        
        # Alert all moderators
        await self._alert_moderators(incident)
    
    async def _alert_moderators(self, incident: Dict):
        """Alert human moderators of safety incident"""
        # In production, this would send alerts to moderation team
        logger.critical(f"SAFETY ALERT: {incident}")
    
    async def _notify_parent_of_incident(self, parent_id: str, incident: Dict):
        """Notify parent of safety incident involving their child"""
        # This would send real-time notification to parent
        logger.info(f"Notified parent {parent_id} of safety incident")
    
    async def leave_classroom(self, session_id: str) -> bool:
        """Remove user from classroom"""
        if session_id not in self.user_sessions:
            return False
        
        user_session = self.user_sessions[session_id]
        
        # Find and remove from classroom
        classroom_id = None
        for cid, classroom in self.active_sessions.items():
            if user_session.user_id in classroom.participants:
                del classroom.participants[user_session.user_id]
                classroom_id = cid
                break
        
        # Clean up session
        del self.user_sessions[session_id]
        
        # End Helyxium session
        await self.helyxium.end_session(session_id)
        
        # Notify other participants
        if classroom_id:
            await self._broadcast_user_left(classroom_id, user_session)
        
        logger.info(f"User {user_session.user_id} left classroom")
        return True
    
    async def end_classroom_session(self, classroom_id: str, teacher_id: str) -> bool:
        """End a classroom session"""
        if classroom_id not in self.active_sessions:
            return False
        
        classroom = self.active_sessions[classroom_id]
        
        # Verify teacher authorization
        if classroom.teacher_id != teacher_id:
            return False
        
        classroom.state = SessionState.ENDING
        
        # Notify all participants
        await self._broadcast_session_ending(classroom_id)
        
        # End all user sessions
        for user_session in classroom.participants.values():
            await self.leave_classroom(user_session.session_id)
        
        # Finalize session
        classroom.state = SessionState.ENDED
        classroom.ended_at = datetime.utcnow()
        
        # Generate session report
        await self._generate_session_report(classroom_id)
        
        # Clean up after delay
        asyncio.create_task(self._cleanup_session_after_delay(classroom_id))
        
        logger.info(f"Ended classroom session {classroom_id}")
        return True
    
    async def _generate_session_report(self, classroom_id: str):
        """Generate post-session report for teachers and parents"""
        classroom = self.active_sessions[classroom_id]
        
        report = {
            "classroom_id": classroom_id,
            "subject": classroom.subject,
            "lesson_id": classroom.lesson_id,
            "duration_minutes": (classroom.ended_at - classroom.started_at).total_seconds() / 60,
            "participant_count": len(classroom.participants),
            "safety_incidents": len(classroom.safety_incidents),
            "learning_objectives_met": [],  # Would be populated from lesson data
            "generated_at": datetime.utcnow().isoformat()
        }
        
        # Store report (in production, save to database)
        logger.info(f"Generated session report for {classroom_id}")
    
    async def _cleanup_session_after_delay(self, classroom_id: str):
        """Clean up session data after delay"""
        await asyncio.sleep(3600)  # Keep data for 1 hour
        
        if classroom_id in self.active_sessions:
            del self.active_sessions[classroom_id]
    
    async def get_session_status(self, classroom_id: str) -> Optional[Dict]:
        """Get current status of classroom session"""
        if classroom_id not in self.active_sessions:
            return None
        
        classroom = self.active_sessions[classroom_id]
        
        return {
            "classroom_id": classroom_id,
            "state": classroom.state.value,
            "participant_count": len(classroom.participants),
            "created_at": classroom.created_at.isoformat(),
            "started_at": classroom.started_at.isoformat() if classroom.started_at else None,
            "subject": classroom.subject,
            "lesson_id": classroom.lesson_id,
            "safety_incident_count": len(classroom.safety_incidents)
        }
    
    async def _broadcast_user_joined(self, classroom_id: str, user_session: UserSession):
        """Broadcast to other participants that a user joined"""
        # This would send WebSocket messages to all participants
        pass
    
    async def _broadcast_user_left(self, classroom_id: str, user_session: UserSession):
        """Broadcast to other participants that a user left"""
        # This would send WebSocket messages to all participants
        pass
    
    async def _broadcast_session_ending(self, classroom_id: str):
        """Broadcast that session is ending"""
        # This would send WebSocket messages to all participants
        pass
    
    async def cleanup_expired_sessions(self):
        """Clean up expired sessions (run periodically)"""
        now = datetime.utcnow()
        expired_sessions = []
        
        for session_id, user_session in self.user_sessions.items():
            if (now - user_session.last_activity).total_seconds() > self.session_timeout:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            await self.leave_classroom(session_id)
        
        logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")