"""Database layer for EG VR Classroom"""

from .models import (
    Base,
    Parent,
    Child,
    ParentalConsent,
    VRSession,
    VRClassroom,
    ClassroomParticipant,
    PhonemicProgress,
    ActivityCompletion,
    Assessment,
    VoiceInteraction,
    ContentLibrary,
    HeggertyCurriculum,
    VRInteraction,
    DailyLandmark,
    ApprovedPhrase,
    CommunicationLog,
    SafetyIncident,
    SystemAnalytics,
    SessionAnalytics,
)
from .connection import DatabaseManager, db_manager, get_session, session_scope

__all__ = [
    # Base
    'Base',
    # Models
    'Parent',
    'Child',
    'ParentalConsent',
    'VRSession',
    'VRClassroom',
    'ClassroomParticipant',
    'PhonemicProgress',
    'ActivityCompletion',
    'Assessment',
    'VoiceInteraction',
    'ContentLibrary',
    'HeggertyCurriculum',
    'VRInteraction',
    'DailyLandmark',
    'ApprovedPhrase',
    'CommunicationLog',
    'SafetyIncident',
    'SystemAnalytics',
    'SessionAnalytics',
    # Connection
    'DatabaseManager',
    'db_manager',
    'get_session',
    'session_scope',
]
