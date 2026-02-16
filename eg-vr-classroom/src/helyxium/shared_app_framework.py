"""
Shared VR App Framework for Helyxium
Base classes and utilities for creating VR experiences within Helyxium
"""

import asyncio
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class VRExperienceType(Enum):
    """Types of VR experiences"""
    EDUCATIONAL = "educational"
    SHOPPING = "shopping"
    SOCIAL = "social"
    ENTERTAINMENT = "entertainment"
    SIMULATION = "simulation"
    PRODUCTIVITY = "productivity"
    WELLNESS = "wellness"


class InteractionMode(Enum):
    """VR interaction modes"""
    HANDS_FREE = "hands_free"          # Gaze and voice only
    HAND_TRACKING = "hand_tracking"    # Full hand tracking
    CONTROLLERS = "controllers"        # VR controllers
    MIXED = "mixed"                    # Multiple input methods


@dataclass
class VREnvironment:
    """VR environment configuration"""
    environment_id: str
    name: str
    description: str
    scene_file: str
    lighting_preset: str
    background_audio: Optional[str]
    interaction_zones: List[Dict[str, Any]]
    safety_boundaries: Dict[str, Any]
    localization_support: bool
    max_users: int
    physics_enabled: bool


@dataclass
class UserState:
    """Current user state in VR"""
    user_id: str
    position: tuple[float, float, float]
    rotation: tuple[float, float, float, float]  # quaternion
    avatar_id: str
    interaction_mode: InteractionMode
    voice_activity: bool
    gesture_state: Optional[str]
    controller_states: Dict[str, Any]
    safety_status: str


class BaseVRApp(ABC):
    """
    Base class for all Helyxium VR apps
    Provides common functionality and structure
    """
    
    def __init__(self, app_id: str, experience_type: VRExperienceType):
        self.app_id = app_id
        self.experience_type = experience_type
        self.context: Optional['AppContext'] = None
        
        # App state
        self.is_initialized = False
        self.is_running = False
        self.users: Dict[str, UserState] = {}
        
        # Services (injected by Helyxium)
        self.translation_service = None
        self.location_service = None
        self.safety_service = None
        self.vr_renderer = None
        self.audio_service = None
        
        # Event handlers
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        # Environment
        self.current_environment: Optional[VREnvironment] = None
    
    @abstractmethod
    async def on_initialize(self, context: 'AppContext') -> bool:
        """Initialize the VR app"""
        pass
    
    @abstractmethod
    async def on_launch(self, context: 'AppContext', launch_params: Dict[str, Any]) -> bool:
        """Launch the VR app"""
        pass
    
    @abstractmethod
    async def on_user_joined(self, user_state: UserState):
        """Handle user joining the experience"""
        pass
    
    @abstractmethod
    async def on_user_left(self, user_id: str):
        """Handle user leaving the experience"""
        pass
    
    @abstractmethod
    async def on_shutdown(self, context: 'AppContext'):
        """Clean shutdown of the app"""
        pass
    
    # Common functionality
    
    def register_event_handler(self, event_type: str, handler: Callable):
        """Register event handler"""
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)
    
    async def emit_event(self, event_type: str, event_data: Any):
        """Emit event to registered handlers"""
        if event_type in self.event_handlers:
            for handler in self.event_handlers[event_type]:
                try:
                    await handler(event_data)
                except Exception as e:
                    logger.error(f"Event handler error for {event_type}: {e}")
    
    async def load_environment(self, environment: VREnvironment):
        """Load VR environment"""
        if not self.vr_renderer:
            logger.error("VR renderer not available")
            return False
        
        try:
            # Load scene
            await self.vr_renderer.load_scene(environment.scene_file)
            
            # Setup lighting
            await self.vr_renderer.set_lighting(environment.lighting_preset)
            
            # Setup audio
            if environment.background_audio and self.audio_service:
                await self.audio_service.play_ambient(environment.background_audio)
            
            # Configure interaction zones
            for zone in environment.interaction_zones:
                await self.vr_renderer.create_interaction_zone(zone)
            
            # Setup safety boundaries
            await self.vr_renderer.set_safety_boundaries(environment.safety_boundaries)
            
            self.current_environment = environment
            logger.info(f"Loaded environment: {environment.name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load environment {environment.name}: {e}")
            return False
    
    async def localize_environment(self, location_data: Dict[str, Any]):
        """Localize environment based on user location"""
        if not self.current_environment or not self.current_environment.localization_support:
            return
        
        # Update flag textures
        if "country_code" in location_data:
            flag_texture = f"flags/{location_data['country_code'].lower()}.png"
            await self.vr_renderer.update_texture("flag", flag_texture)
        
        # Update currency symbols
        if "currency" in location_data:
            await self.vr_renderer.update_ui_text("currency_symbol", location_data["currency"])
        
        # Update measurement system
        if "measurement_system" in location_data:
            measurement_assets = f"measurements_{location_data['measurement_system']}"
            await self.vr_renderer.load_asset_pack(measurement_assets)
    
    async def handle_voice_input(self, user_id: str, audio_data: bytes, language: str):
        """Handle voice input with translation"""
        if not self.translation_service:
            return
        
        # Get target languages for other users
        target_languages = []
        for uid, user_state in self.users.items():
            if uid != user_id:
                user_lang = await self._get_user_language(uid)
                if user_lang != language:
                    target_languages.append(user_lang)
        
        if target_languages:
            # Translate voice
            translations = await self.translation_service.translate_voice(
                audio_data, language, target_languages
            )
            
            # Send translated audio to appropriate users
            for target_lang, translated_audio in translations.items():
                await self._send_translated_audio(translated_audio, target_lang)
    
    async def _get_user_language(self, user_id: str) -> str:
        """Get user's preferred language"""
        # This would integrate with user preferences
        return "en"  # Default
    
    async def _send_translated_audio(self, audio_data: bytes, language: str):
        """Send translated audio to users who need it"""
        # This would send audio through the communication system
        pass
    
    async def create_shared_object(self, object_id: str, object_data: Dict[str, Any]):
        """Create shared object visible to all users"""
        await self.vr_renderer.create_shared_object(object_id, object_data)
        
        # Notify all users
        await self.emit_event("shared_object_created", {
            "object_id": object_id,
            "data": object_data
        })
    
    async def update_shared_object(self, object_id: str, updates: Dict[str, Any]):
        """Update shared object"""
        await self.vr_renderer.update_shared_object(object_id, updates)
        
        # Notify all users
        await self.emit_event("shared_object_updated", {
            "object_id": object_id,
            "updates": updates
        })
    
    async def handle_safety_incident(self, user_id: str, incident_type: str, data: Dict[str, Any]):
        """Handle safety incident"""
        if not self.safety_service:
            return
        
        incident = {
            "app_id": self.app_id,
            "user_id": user_id,
            "incident_type": incident_type,
            "data": data,
            "environment": self.current_environment.environment_id if self.current_environment else None
        }
        
        await self.safety_service.report_incident(incident)
        
        # Take immediate action for severe incidents
        if incident_type in ["inappropriate_content", "adult_voice_detected", "harassment"]:
            await self._emergency_user_removal(user_id)
    
    async def _emergency_user_removal(self, user_id: str):
        """Emergency removal of user from experience"""
        if user_id in self.users:
            await self.on_user_left(user_id)
            del self.users[user_id]
        
        logger.warning(f"Emergency removal of user {user_id} from {self.app_id}")


class EducationalVRApp(BaseVRApp):
    """
    Specialized base class for educational VR apps
    Includes curriculum integration, progress tracking, and child safety
    """
    
    def __init__(self, app_id: str):
        super().__init__(app_id, VRExperienceType.EDUCATIONAL)
        
        # Educational features
        self.curriculum_service = None
        self.progress_tracker = None
        self.parent_observer_mode = True
        self.content_filter_level = "strict"
        
        # Learning analytics
        self.learning_sessions: Dict[str, Dict] = {}
        self.assessment_results: Dict[str, List] = {}
    
    async def start_learning_session(self, user_id: str, lesson_id: str):
        """Start a learning session"""
        session_data = {
            "lesson_id": lesson_id,
            "start_time": asyncio.get_event_loop().time(),
            "interactions": [],
            "progress": {},
            "achievements": []
        }
        
        self.learning_sessions[user_id] = session_data
        
        if self.curriculum_service:
            await self.curriculum_service.start_session(user_id, lesson_id)
    
    async def track_learning_interaction(self, user_id: str, interaction_type: str, 
                                       interaction_data: Dict[str, Any]):
        """Track learning interaction for analytics"""
        if user_id in self.learning_sessions:
            self.learning_sessions[user_id]["interactions"].append({
                "type": interaction_type,
                "data": interaction_data,
                "timestamp": asyncio.get_event_loop().time()
            })
    
    async def assess_student_response(self, user_id: str, question_id: str, 
                                    response_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess student response"""
        if not self.curriculum_service:
            return {"correct": True, "feedback": "Good job!"}
        
        assessment = await self.curriculum_service.assess_response(
            question_id, response_data
        )
        
        # Track assessment result
        if user_id not in self.assessment_results:
            self.assessment_results[user_id] = []
        
        self.assessment_results[user_id].append({
            "question_id": question_id,
            "response": response_data,
            "assessment": assessment,
            "timestamp": asyncio.get_event_loop().time()
        })
        
        return assessment
    
    async def notify_parent_progress(self, child_id: str):
        """Notify parent of child's progress"""
        if child_id not in self.learning_sessions:
            return
        
        session = self.learning_sessions[child_id]
        progress_report = {
            "child_id": child_id,
            "lesson_id": session["lesson_id"],
            "duration": asyncio.get_event_loop().time() - session["start_time"],
            "interactions_count": len(session["interactions"]),
            "achievements": session["achievements"],
            "app_id": self.app_id
        }
        
        # Send through parent notification system
        await self.emit_event("parent_notification", progress_report)


class SocialVRApp(BaseVRApp):
    """
    Base class for social VR experiences
    Includes communication, moderation, and social features
    """
    
    def __init__(self, app_id: str):
        super().__init__(app_id, VRExperienceType.SOCIAL)
        
        # Social features
        self.communication_filters = []
        self.moderation_service = None
        self.social_spaces: Dict[str, List[str]] = {}  # space_id -> user_ids
        
        # Communication settings
        self.voice_chat_enabled = True
        self.gesture_communication = True
        self.text_chat_enabled = False  # Usually disabled for child safety
    
    async def create_social_space(self, space_id: str, config: Dict[str, Any]):
        """Create a social space within the experience"""
        self.social_spaces[space_id] = []
        
        # Configure space
        await self.vr_renderer.create_social_space(space_id, config)
    
    async def join_social_space(self, user_id: str, space_id: str):
        """Move user to a social space"""
        if space_id not in self.social_spaces:
            return False
        
        # Remove from current spaces
        for sid, users in self.social_spaces.items():
            if user_id in users:
                users.remove(user_id)
        
        # Add to new space
        self.social_spaces[space_id].append(user_id)
        
        # Update user position
        await self.vr_renderer.move_user_to_space(user_id, space_id)
        
        return True
    
    async def moderate_communication(self, sender_id: str, content: Any, 
                                   communication_type: str) -> bool:
        """Moderate communication content"""
        if not self.moderation_service:
            return True
        
        is_appropriate = await self.moderation_service.check_content(
            content, communication_type, self.app_id
        )
        
        if not is_appropriate:
            await self.handle_safety_incident(
                sender_id, "inappropriate_communication", 
                {"content_type": communication_type}
            )
            return False
        
        return True


class ShoppingVRApp(BaseVRApp):
    """
    Base class for VR shopping experiences
    Includes product display, transactions, and inventory
    """
    
    def __init__(self, app_id: str):
        super().__init__(app_id, VRExperienceType.SHOPPING)
        
        # Shopping features
        self.product_catalog = {}
        self.user_carts: Dict[str, List] = {}
        self.payment_service = None
        
        # Store configuration
        self.store_layout = "mall"  # "mall", "street", "marketplace"
        self.currency_support = ["USD", "EUR", "GBP", "JPY"]
    
    async def load_product_catalog(self, catalog_data: Dict[str, Any]):
        """Load product catalog"""
        self.product_catalog = catalog_data
        
        # Create 3D product displays
        for product_id, product in catalog_data.items():
            await self._create_product_display(product_id, product)
    
    async def _create_product_display(self, product_id: str, product: Dict[str, Any]):
        """Create 3D product display"""
        display_config = {
            "model": product.get("3d_model"),
            "position": product.get("display_position"),
            "info_panel": {
                "name": product["name"],
                "price": product["price"],
                "description": product["description"]
            },
            "interactive": True
        }
        
        await self.vr_renderer.create_product_display(product_id, display_config)
    
    async def add_to_cart(self, user_id: str, product_id: str, quantity: int = 1):
        """Add item to user's cart"""
        if user_id not in self.user_carts:
            self.user_carts[user_id] = []
        
        cart_item = {
            "product_id": product_id,
            "quantity": quantity,
            "added_at": asyncio.get_event_loop().time()
        }
        
        self.user_carts[user_id].append(cart_item)
        
        # Update user's cart UI
        await self._update_cart_ui(user_id)
    
    async def _update_cart_ui(self, user_id: str):
        """Update cart UI for user"""
        cart = self.user_carts.get(user_id, [])
        total_items = sum(item["quantity"] for item in cart)
        
        await self.vr_renderer.update_user_ui(user_id, "cart_count", total_items)


class SimulationVRApp(BaseVRApp):
    """
    Base class for VR simulation experiences
    Includes physics, realistic interactions, and scenario management
    """
    
    def __init__(self, app_id: str):
        super().__init__(app_id, VRExperienceType.SIMULATION)
        
        # Simulation features
        self.physics_engine = None
        self.simulation_state = {}
        self.scenarios: Dict[str, Dict] = {}
        
        # Realism settings
        self.physics_accuracy = "high"
        self.collision_detection = True
        self.realistic_materials = True
    
    async def load_scenario(self, scenario_id: str, scenario_config: Dict[str, Any]):
        """Load simulation scenario"""
        self.scenarios[scenario_id] = scenario_config
        
        # Initialize physics objects
        for obj in scenario_config.get("physics_objects", []):
            await self.physics_engine.create_object(obj)
        
        # Set environmental conditions
        conditions = scenario_config.get("environment", {})
        await self._apply_environmental_conditions(conditions)
    
    async def _apply_environmental_conditions(self, conditions: Dict[str, Any]):
        """Apply environmental conditions (gravity, wind, etc.)"""
        if "gravity" in conditions:
            await self.physics_engine.set_gravity(conditions["gravity"])
        
        if "wind" in conditions:
            await self.physics_engine.set_wind(conditions["wind"])
        
        if "temperature" in conditions:
            await self.vr_renderer.set_temperature_effects(conditions["temperature"])


# Factory function for creating app instances
def create_vr_app(app_type: VRExperienceType, app_id: str) -> BaseVRApp:
    """Factory function to create VR app instances"""
    
    app_classes = {
        VRExperienceType.EDUCATIONAL: EducationalVRApp,
        VRExperienceType.SOCIAL: SocialVRApp,
        VRExperienceType.SHOPPING: ShoppingVRApp,
        VRExperienceType.SIMULATION: SimulationVRApp
    }
    
    app_class = app_classes.get(app_type, BaseVRApp)
    return app_class(app_id)