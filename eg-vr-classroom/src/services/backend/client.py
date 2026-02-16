"""
EG Backend API Client
Connects to Flask backend for curriculum, progress tracking, and AI services
"""

import logging
from typing import Dict, List, Optional, Any
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from src.core.config import config
from src.core.auth import jwt_manager

logger = logging.getLogger(__name__)


class BackendAPIError(Exception):
    """Backend API error"""
    pass


class EGBackendClient:
    """
    Client for Elemental Genius Flask Backend

    Provides access to:
    - Curriculum (Heggerty, STEM, Character Values)
    - Progress tracking
    - Voice processing
    - AI character interactions
    - Parent monitoring
    """

    def __init__(self, base_url: Optional[str] = None, timeout: int = 30):
        """
        Initialize backend client

        Args:
            base_url: Backend URL (defaults to config)
            timeout: Request timeout in seconds
        """
        service_config = config.get_service_config('backend')

        self.base_url = base_url or service_config.url
        self.timeout = timeout
        self.session = self._create_session()

        logger.info(f"EG Backend client initialized: {self.base_url}")

    def _create_session(self) -> requests.Session:
        """Create requests session with retry logic"""
        session = requests.Session()

        # Retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS", "POST", "PUT"]
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        return session

    def _make_request(
        self,
        method: str,
        endpoint: str,
        token: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Make HTTP request to backend

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            token: JWT token for authentication
            **kwargs: Additional request parameters

        Returns:
            Response data as dictionary

        Raises:
            BackendAPIError: If request fails
        """
        url = f"{self.base_url}{endpoint}"

        headers = kwargs.pop('headers', {})
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=headers,
                timeout=self.timeout,
                **kwargs
            )

            response.raise_for_status()
            return response.json()

        except requests.exceptions.HTTPError as e:
            logger.error(f"Backend HTTP error: {e}")
            raise BackendAPIError(f"HTTP {e.response.status_code}: {e.response.text}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Backend request failed: {e}")
            raise BackendAPIError(f"Request failed: {e}")

    # ========================================================================
    # AUTHENTICATION
    # ========================================================================

    def login_parent(self, email: str, password: str) -> Dict[str, Any]:
        """
        Parent login via backend

        Args:
            email: Parent email
            password: Parent password

        Returns:
            {
                'token': 'jwt_token',
                'parent': {...},
                'expires_in_hours': 24
            }
        """
        return self._make_request(
            'POST',
            '/parent/login',
            json={'email': email, 'password': password}
        )

    def login_child(self, child_id: int, parent_token: str) -> Dict[str, Any]:
        """
        Child login via backend (COPPA-compliant)

        Args:
            child_id: Child ID
            parent_token: Parent JWT token

        Returns:
            {
                'token': 'child_jwt_token',
                'child': {...},
                'session_duration_hours': 4
            }
        """
        return self._make_request(
            'POST',
            '/child/login',
            json={'child_id': child_id, 'parent_token': parent_token}
        )

    # ========================================================================
    # CURRICULUM
    # ========================================================================

    def get_week_curriculum(self, week_number: int, token: str) -> Dict[str, Any]:
        """
        Get Heggerty curriculum for a specific week

        Args:
            week_number: Week number (1-35)
            token: Authentication token

        Returns:
            {
                'week_number': 3,
                'active_skills': ['rhyming', 'onset_fluency'],
                'activities': {...},
                'nursery_rhyme': {...}
            }
        """
        return self._make_request(
            'GET',
            f'/curriculum/week/{week_number}',
            token=token
        )

    def get_child_dashboard(self, token: str) -> Dict[str, Any]:
        """
        Get child's personalized dashboard

        Args:
            token: Child JWT token

        Returns:
            {
                'child': {...},
                'week_activities': {...},
                'progress': {...},
                'recommendation': {...}
            }
        """
        return self._make_request(
            'GET',
            '/child/dashboard',
            token=token
        )

    def get_activity_details(
        self,
        activity_type: str,
        token: str
    ) -> Dict[str, Any]:
        """
        Get details for a specific activity

        Args:
            activity_type: Activity type (e.g., 'rhyming')
            token: Child JWT token

        Returns:
            Activity details with instructions and examples
        """
        return self._make_request(
            'GET',
            f'/child/activity/{activity_type}',
            token=token
        )

    def complete_activity(
        self,
        activity_type: str,
        accuracy: float,
        duration: int,
        stars_earned: int,
        engagement: float,
        token: str
    ) -> Dict[str, Any]:
        """
        Submit activity completion

        Args:
            activity_type: Activity type
            accuracy: Accuracy percentage (0-100)
            duration: Duration in seconds
            stars_earned: Stars earned (0-5)
            engagement: Engagement score (0-10)
            token: Child JWT token

        Returns:
            {
                'progress_gained': 5.2,
                'new_progress': 80.2,
                'stars_earned': 3
            }
        """
        return self._make_request(
            'POST',
            f'/child/activity/{activity_type}/complete',
            token=token,
            json={
                'accuracy': accuracy,
                'duration': duration,
                'stars_earned': stars_earned,
                'engagement': engagement
            }
        )

    # ========================================================================
    # VOICE INTERACTIONS (COPPA-Compliant)
    # ========================================================================

    def log_voice_interaction(
        self,
        interaction_type: str,
        prompt_given: str,
        expected_response: str,
        actual_response: str,
        confidence: float,
        accuracy: float,
        response_time: float,
        success: bool,
        session_id: int,
        token: str
    ) -> Dict[str, Any]:
        """
        Log voice interaction (text only, no audio)

        Args:
            interaction_type: Type of interaction
            prompt_given: What was asked
            expected_response: Expected answer
            actual_response: What child said (transcribed)
            confidence: Recognition confidence (0-1)
            accuracy: Accuracy score (0-1)
            response_time: Response time in seconds
            success: Whether successful
            session_id: VR session ID
            token: Child JWT token

        Returns:
            Confirmation of logged interaction
        """
        return self._make_request(
            'POST',
            '/child/voice-interactions',
            token=token,
            json={
                'interaction_type': interaction_type,
                'prompt_given': prompt_given,
                'expected_response': expected_response,
                'actual_response': actual_response,
                'recognition_confidence': confidence,
                'accuracy_score': accuracy,
                'response_time_seconds': response_time,
                'success_achieved': success,
                'session_id': session_id
            }
        )

    # ========================================================================
    # PROGRESS TRACKING
    # ========================================================================

    def get_phonemic_progress(
        self,
        child_id: int,
        parent_token: str
    ) -> Dict[str, Any]:
        """
        Get phonemic awareness progress

        Args:
            child_id: Child ID
            parent_token: Parent JWT token

        Returns:
            Detailed phonemic progress by skill
        """
        return self._make_request(
            'GET',
            f'/child/phonemic-progress?child_id={child_id}',
            token=parent_token
        )

    def update_phonemic_progress(
        self,
        skill_type: str,
        skill_category: str,
        week_number: int,
        mastery_level: float,
        accuracy_percentage: float,
        attempts_total: int,
        attempts_correct: int,
        token: str
    ) -> Dict[str, Any]:
        """
        Update phonemic progress

        Args:
            skill_type: Skill type (rhyming, syllables, etc.)
            skill_category: Category (listen_identify, etc.)
            week_number: Current week
            mastery_level: Mastery percentage
            accuracy_percentage: Accuracy percentage
            attempts_total: Total attempts
            attempts_correct: Correct attempts
            token: Child JWT token

        Returns:
            Updated progress confirmation
        """
        return self._make_request(
            'POST',
            '/child/phonemic-progress',
            token=token,
            json={
                'skill_type': skill_type,
                'skill_category': skill_category,
                'week_number': week_number,
                'mastery_level': mastery_level,
                'accuracy_percentage': accuracy_percentage,
                'attempts_total': attempts_total,
                'attempts_correct': attempts_correct
            }
        )

    # ========================================================================
    # LEARNING SESSIONS
    # ========================================================================

    def start_learning_session(
        self,
        session_type: str,
        planned_duration: int,
        activities_planned: int,
        token: str
    ) -> Dict[str, Any]:
        """
        Start a learning session

        Args:
            session_type: Session type (daily_practice, assessment, etc.)
            planned_duration: Planned duration in seconds
            activities_planned: Number of activities planned
            token: Child JWT token

        Returns:
            {
                'session_id': 123,
                'started_at': '2025-10-08T10:00:00Z'
            }
        """
        return self._make_request(
            'POST',
            '/child/learning-sessions',
            token=token,
            json={
                'session_type': session_type,
                'planned_duration': planned_duration,
                'activities_planned': activities_planned
            }
        )

    def complete_learning_session(
        self,
        session_id: int,
        actual_duration: int,
        activities_completed: int,
        overall_accuracy: float,
        engagement_score: float,
        stars_earned: int,
        token: str
    ) -> Dict[str, Any]:
        """
        Complete a learning session

        Args:
            session_id: Session ID
            actual_duration: Actual duration in seconds
            activities_completed: Activities completed
            overall_accuracy: Overall accuracy percentage
            engagement_score: Engagement score (0-10)
            stars_earned: Total stars earned
            token: Child JWT token

        Returns:
            Session completion confirmation
        """
        return self._make_request(
            'PUT',
            f'/child/learning-sessions/{session_id}/complete',
            token=token,
            json={
                'actual_duration': actual_duration,
                'completion_status': 'completed',
                'activities_completed': activities_completed,
                'overall_accuracy': overall_accuracy,
                'engagement_score': engagement_score,
                'stars_earned': stars_earned
            }
        )

    # ========================================================================
    # ASSESSMENTS
    # ========================================================================

    def get_child_assessment(self, token: str) -> Dict[str, Any]:
        """
        Get comprehensive child assessment

        Args:
            token: Child JWT token

        Returns:
            {
                'child_info': {...},
                'overall_assessment': {...},
                'skill_assessments': {...},
                'next_objectives': [...]
            }
        """
        return self._make_request(
            'GET',
            '/child/assessment',
            token=token
        )

    # ========================================================================
    # CONTENT LIBRARY
    # ========================================================================

    def get_content(
        self,
        subject_area: Optional[str] = None,
        age_range: Optional[str] = None,
        page: int = 1,
        token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get educational content from library

        Args:
            subject_area: Subject filter
            age_range: Age range filter
            page: Page number
            token: Authentication token

        Returns:
            {
                'content': [...],
                'pagination': {...}
            }
        """
        params = {'page': page}
        if subject_area:
            params['subject_area'] = subject_area
        if age_range:
            params['age_range'] = age_range

        return self._make_request(
            'GET',
            '/content',
            token=token,
            params=params
        )

    # ========================================================================
    # ANALYTICS & PARENT DASHBOARD
    # ========================================================================

    def get_parent_analytics(self, parent_token: str) -> Dict[str, Any]:
        """
        Get parent analytics dashboard

        Args:
            parent_token: Parent JWT token

        Returns:
            {
                'summary': {...},
                'recent_assessments': [...],
                'children': [...]
            }
        """
        return self._make_request(
            'GET',
            '/analytics/dashboard',
            token=parent_token
        )

    def health_check(self) -> bool:
        """
        Check if backend is healthy

        Returns:
            True if backend is responding
        """
        try:
            response = self.session.get(
                f"{self.base_url}/",
                timeout=5
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Backend health check failed: {e}")
            return False


# Global instance
backend_client = EGBackendClient()
