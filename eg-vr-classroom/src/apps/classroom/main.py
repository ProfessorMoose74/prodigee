"""
Elemental Genius VR Classroom - Helyxium App
Main entry point for the VR Classroom app within Helyxium
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass

from helyxium_sdk import HelyxiumApp, AppContext, AppState
from helyxium_sdk.services import TranslationService, LocationService, SafetyService
from helyxium_sdk.auth import ParentChildAuth
from helyxium_sdk.vr import VRRenderer, VRInputManager

# Import our classroom-specific components
from .classroom_manager import ClassroomManager
from .safety_monitor import ClassroomSafetyMonitor
from .curriculum_integration import ElementalGeniusIntegration

logger = logging.getLogger(__name__)


@dataclass
class ClassroomConfig:
    """Configuration for VR Classroom app"""
    max_students_per_class: int = 25
    session_timeout: int = 3600
    default_subject: str = "phonics"
    enable_parent_observation: bool = True
    safety_level: str = "strict"
    auto_translation: bool = True


class ClassroomApp(HelyxiumApp):
    """
    Main VR Classroom application class
    Integrates with Helyxium's core services
    """
    
    def __init__(self):
        super().__init__(
            app_id="elemental_genius_vr_classroom",
            app_name="VR Classroom",
            version="1.0.0"
        )
        
        # App components
        self.classroom_manager: Optional[ClassroomManager] = None
        self.safety_monitor: Optional[ClassroomSafetyMonitor] = None
        self.curriculum: Optional[ElementalGeniusIntegration] = None
        
        # Configuration
        self.config = ClassroomConfig()
        
    async def on_initialize(self, context: AppContext) -> bool:
        """Initialize the VR Classroom app"""
        try:
            logger.info("Initializing VR Classroom app")
            
            # Get Helyxium services
            translation_service = context.get_service(TranslationService)
            location_service = context.get_service(LocationService)
            safety_service = context.get_service(SafetyService)
            auth_service = context.get_service(ParentChildAuth)
            
            # Initialize classroom manager
            self.classroom_manager = ClassroomManager(
                translation_service=translation_service,
                location_service=location_service,
                auth_service=auth_service,
                config=self.config
            )
            
            # Initialize safety monitoring
            self.safety_monitor = ClassroomSafetyMonitor(
                safety_service=safety_service,
                auth_service=auth_service
            )
            
            # Initialize curriculum integration
            self.curriculum = ElementalGeniusIntegration(
                api_endpoint=self.get_setting("elemental_genius_api_endpoint"),
                api_key=self.get_setting("elemental_genius_api_key")
            )
            
            # Connect safety monitor to classroom manager
            self.classroom_manager.set_safety_monitor(self.safety_monitor)
            
            logger.info("VR Classroom app initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize VR Classroom app: {e}")
            return False
    
    async def on_launch(self, context: AppContext, launch_params: Dict[str, Any]) -> bool:
        """Launch the VR Classroom"""
        try:
            logger.info("Launching VR Classroom")
            
            # Check authentication
            if not context.user.is_authenticated:
                await self._show_authentication_screen(context)
                return False
            
            # Verify parent/child relationship for child accounts
            if context.user.account_type == "child":
                if not await self._verify_parent_authorization(context):
                    await self._show_parent_authorization_required(context)
                    return False
            
            # Get user's location for classroom localization
            user_location = await context.get_service(LocationService).get_user_location()
            
            # Create or join classroom
            classroom_id = launch_params.get("classroom_id")
            if classroom_id:
                # Join existing classroom
                success = await self.classroom_manager.join_classroom(
                    classroom_id=classroom_id,
                    user_id=context.user.user_id,
                    location=user_location
                )
            else:
                # Create new classroom (teacher only)
                if context.user.account_type != "teacher":
                    await self._show_classroom_browser(context)
                    return True
                
                success = await self.classroom_manager.create_classroom(
                    teacher_id=context.user.user_id,
                    subject=launch_params.get("subject", self.config.default_subject),
                    location=user_location
                )
            
            if not success:
                await self._show_error_screen(context, "Failed to join classroom")
                return False
            
            # Initialize VR environment
            await self._setup_vr_environment(context, user_location)
            
            # Start main classroom loop
            asyncio.create_task(self._classroom_update_loop(context))
            
            logger.info("VR Classroom launched successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to launch VR Classroom: {e}")
            await self._show_error_screen(context, str(e))
            return False
    
    async def _verify_parent_authorization(self, context: AppContext) -> bool:
        """Verify parent has authorized child access"""
        auth_service = context.get_service(ParentChildAuth)
        
        # Check if parent token is valid
        parent_token = context.get_launch_parameter("parent_token")
        if not parent_token:
            return False
        
        return await auth_service.verify_child_authorization(
            child_id=context.user.user_id,
            parent_token=parent_token
        )
    
    async def _setup_vr_environment(self, context: AppContext, location):
        """Set up the VR classroom environment"""
        vr_renderer = context.get_service(VRRenderer)
        
        # Load classroom assets based on location
        classroom_scene = await self._create_localized_classroom(location)
        
        # Load into VR renderer
        await vr_renderer.load_scene(classroom_scene)
        
        # Set up interaction handlers
        input_manager = context.get_service(VRInputManager)
        await self._setup_interaction_handlers(input_manager)
    
    async def _create_localized_classroom(self, location) -> Dict[str, Any]:
        """Create classroom scene with localized content"""
        scene = {
            "environment": "1920s_american_classroom",
            "lighting": "natural_daylight",
            "localization": {
                "flag_texture": f"flags/{location.country_code.lower()}.png",
                "map_texture": f"maps/{location.country_code.lower()}.png",
                "clock_timezone": location.timezone,
                "measurement_system": location.measurement_system,
                "currency_symbols": location.currency_code
            },
            "interactive_objects": [
                {
                    "type": "blackboard",
                    "position": [0, 1.5, 3],
                    "interactive": True
                },
                {
                    "type": "student_desks", 
                    "count": 25,
                    "arrangement": "rows"
                },
                {
                    "type": "world_map",
                    "position": [2, 2, 0],
                    "country_highlight": location.country_code
                }
            ],
            "lunch_room": {
                "daily_landmark": await self._get_daily_landmark(location),
                "seating_arrangement": "long_tables"
            }
        }
        
        return scene
    
    async def _get_daily_landmark(self, location) -> Dict[str, Any]:
        """Get today's featured landmark for lunch room mural"""
        location_service = self.context.get_service(LocationService)
        landmarks = await location_service.get_local_landmarks(
            country_code=location.country_code,
            include_international=True,
            ratio_local=0.4
        )
        
        # Simple daily rotation
        import datetime
        day_of_year = datetime.datetime.now().timetuple().tm_yday
        landmark_index = day_of_year % len(landmarks)
        
        return landmarks[landmark_index] if landmarks else None
    
    async def _setup_interaction_handlers(self, input_manager):
        """Set up VR interaction handlers"""
        # Hand tracking for grabbing objects
        input_manager.on_grab(self._handle_object_grab)
        
        # Voice commands
        input_manager.on_voice_command(self._handle_voice_command)
        
        # Gesture recognition
        input_manager.on_gesture(self._handle_gesture)
        
        # Controller interactions
        input_manager.on_controller_input(self._handle_controller_input)
    
    async def _handle_object_grab(self, event):
        """Handle object grab interactions"""
        object_id = event.object_id
        user_id = event.user_id
        
        # Special handling for educational objects
        if object_id.startswith("lesson_"):
            await self.curriculum.handle_object_interaction(user_id, object_id)
        
        # Safety check for child users
        if event.user.account_type == "child":
            await self.safety_monitor.monitor_interaction(event)
    
    async def _handle_voice_command(self, event):
        """Handle voice commands and translation"""
        audio_data = event.audio_data
        user_id = event.user_id
        
        # Safety verification for child voices
        if event.user.account_type == "child":
            is_child_voice = await self.safety_monitor.verify_child_voice(
                audio_data, user_id
            )
            if not is_child_voice:
                await self.safety_monitor.trigger_safety_alert(
                    user_id, "adult_voice_detected"
                )
                return
        
        # Process voice command
        translation_service = self.context.get_service(TranslationService)
        
        # Detect language
        detected_lang = await translation_service.detect_language(audio_data)
        
        # Get classroom participants' languages
        classroom = await self.classroom_manager.get_current_classroom(user_id)
        target_languages = classroom.get_participant_languages()
        
        # Translate to all needed languages
        if len(target_languages) > 1:
            translations = await translation_service.translate_voice(
                audio_data=audio_data,
                source_language=detected_lang,
                target_languages=target_languages
            )
            
            # Broadcast translations
            await self.classroom_manager.broadcast_translated_voice(
                classroom.id, user_id, translations
            )
    
    async def _handle_gesture(self, event):
        """Handle gesture recognition"""
        gesture = event.gesture
        user_id = event.user_id
        confidence = event.confidence
        
        # Educational gestures (hand raising, pointing, etc.)
        if gesture == "raise_hand":
            await self.classroom_manager.handle_student_hand_raise(user_id)
        elif gesture == "point":
            await self.classroom_manager.handle_pointing_gesture(user_id, event.target)
    
    async def _handle_controller_input(self, event):
        """Handle VR controller input"""
        # Platform-specific controller handling
        if event.button == "trigger":
            await self._handle_trigger_press(event)
        elif event.button == "menu":
            await self._show_student_menu(event.user_id)
    
    async def _classroom_update_loop(self, context: AppContext):
        """Main classroom update loop"""
        while context.app_state == AppState.RUNNING:
            try:
                # Update classroom state
                await self.classroom_manager.update()
                
                # Process safety monitoring
                await self.safety_monitor.update()
                
                # Update curriculum progress
                await self.curriculum.update()
                
                # Handle parent notifications
                await self._process_parent_notifications()
                
                await asyncio.sleep(0.1)  # 10 FPS update rate
                
            except Exception as e:
                logger.error(f"Error in classroom update loop: {e}")
                await asyncio.sleep(1.0)
    
    async def _process_parent_notifications(self):
        """Process and send parent notifications"""
        notifications = await self.safety_monitor.get_pending_notifications()
        
        for notification in notifications:
            if notification.type == "safety_incident":
                await self._send_parent_alert(notification)
            elif notification.type == "progress_update":
                await self._send_parent_progress(notification)
            elif notification.type == "session_summary":
                await self._send_session_summary(notification)
    
    async def on_pause(self, context: AppContext):
        """Handle app pause (VR headset removed, etc.)"""
        logger.info("VR Classroom paused")
        
        if self.classroom_manager:
            await self.classroom_manager.pause_session()
    
    async def on_resume(self, context: AppContext):
        """Handle app resume"""
        logger.info("VR Classroom resumed")
        
        if self.classroom_manager:
            await self.classroom_manager.resume_session()
    
    async def on_emergency_stop(self, context: AppContext, reason: str):
        """Handle emergency stop (parent intervention, safety incident)"""
        logger.warning(f"Emergency stop triggered: {reason}")
        
        # Immediately end session
        if self.classroom_manager:
            await self.classroom_manager.emergency_end_session(reason)
        
        # Show safety message
        await self._show_emergency_stop_screen(context, reason)
        
        # Exit app
        await context.exit_app()
    
    async def on_shutdown(self, context: AppContext):
        """Clean shutdown of VR Classroom"""
        logger.info("Shutting down VR Classroom")
        
        try:
            # Save any progress
            if self.curriculum:
                await self.curriculum.save_progress()
            
            # Clean up classroom session
            if self.classroom_manager:
                await self.classroom_manager.cleanup()
            
            # Stop safety monitoring
            if self.safety_monitor:
                await self.safety_monitor.shutdown()
                
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
    
    # UI Screen Methods
    async def _show_authentication_screen(self, context: AppContext):
        """Show authentication screen"""
        ui = context.get_service("UI")
        await ui.show_screen("authentication", {
            "title": "Parent Authorization Required",
            "message": "Please have your parent authorize access to VR Classroom"
        })
    
    async def _show_parent_authorization_required(self, context: AppContext):
        """Show parent authorization required screen"""
        ui = context.get_service("UI")
        await ui.show_screen("parent_auth", {
            "title": "Parent Permission Needed",
            "message": "Your parent must authorize this VR session",
            "qr_code": await self._generate_parent_auth_qr()
        })
    
    async def _show_classroom_browser(self, context: AppContext):
        """Show available classrooms"""
        classrooms = await self.classroom_manager.get_available_classrooms()
        
        ui = context.get_service("UI")
        await ui.show_screen("classroom_browser", {
            "title": "Join a Classroom",
            "classrooms": classrooms
        })
    
    async def _show_error_screen(self, context: AppContext, error_message: str):
        """Show error screen"""
        ui = context.get_service("UI")
        await ui.show_screen("error", {
            "title": "VR Classroom Error",
            "message": error_message,
            "actions": ["Retry", "Exit"]
        })
    
    async def _show_emergency_stop_screen(self, context: AppContext, reason: str):
        """Show emergency stop screen"""
        ui = context.get_service("UI")
        await ui.show_screen("emergency_stop", {
            "title": "Session Ended",
            "message": f"Your VR session has been ended: {reason}",
            "contact_parent": True
        })
    
    # Utility methods
    async def _generate_parent_auth_qr(self) -> str:
        """Generate QR code for parent authorization"""
        # This would generate a QR code that parents can scan
        # to authorize their child's VR session
        return "data:image/png;base64,..."
    
    async def _send_parent_alert(self, notification):
        """Send safety alert to parent"""
        # Use Helyxium's notification service
        pass
    
    async def _send_parent_progress(self, notification):
        """Send progress update to parent"""
        # Use Helyxium's notification service
        pass
    
    async def _send_session_summary(self, notification):
        """Send session summary to parent"""
        # Use Helyxium's notification service
        pass


# App registration function for Helyxium
def create_app():
    """Factory function to create the VR Classroom app"""
    return ClassroomApp()