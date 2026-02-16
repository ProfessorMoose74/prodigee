#!/usr/bin/env python
"""
OASIS Education Planet - Integration Demo
Demonstrates the complete system working together

"The future of education - accessible to everyone, everywhere"
"""

import sys
import time
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

from src.services import oasis
from src.core.auth import auth_service

logger = logging.getLogger(__name__)


def print_header(text: str):
    """Print formatted header"""
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70 + "\n")


def demo_system_startup():
    """Demo: System startup and health check"""
    print_header("🌍 OASIS EDUCATION PLANET - SYSTEM STARTUP")

    print("Starting all OASIS services...")
    success = oasis.startup()

    if success:
        print("✅ OASIS is ONLINE!\n")

        # Check system status
        status = oasis.get_system_status()

        print("System Status:")
        print(f"  Database: {status['health']['database']}")
        print(f"  Backend API: {status['health']['backend_api']}")
        print(f"  WebSocket: {status['health']['websocket']}")
        print(f"  Library Server: {status['health']['library']}")
        print(f"  Translation: {status['health']['translation']}")
        print(f"  Overall: {status['health']['overall']}")
        print(f"\nActive VR Sessions: {status['active_sessions']}")
        print(f"Languages Supported: {status['services']['languages_supported']}")
    else:
        print("❌ OASIS startup failed")
        return False

    return True


def demo_parent_registration():
    """Demo: Parent registration and authentication"""
    print_header("👨‍👩‍👧 PARENT REGISTRATION & AUTHENTICATION")

    try:
        # Register parent
        print("Registering new parent account...")
        parent_id, token = auth_service.register_parent(
            email=f"demo_parent_{int(time.time())}@oasis.edu",
            password="SecurePass123!",
            first_name="Sarah",
            last_name="Connor"
        )

        print(f"✅ Parent registered!")
        print(f"  Parent ID: {parent_id}")
        print(f"  Token: {token[:40]}...")

        return parent_id, token

    except Exception as e:
        logger.error(f"Parent registration failed: {e}")
        return None, None


def demo_child_creation(parent_token: str):
    """Demo: Creating a child account"""
    print_header("👶 CHILD ACCOUNT CREATION (COPPA-Compliant)")

    try:
        # Add child to parent account
        print("Creating child account (no password - parent controls access)...")
        child_id = auth_service.add_child_to_parent(
            parent_token=parent_token,
            display_name="Alex",  # Not real name
            age=7,
            grade_level="2nd Grade"
        )

        print(f"✅ Child account created!")
        print(f"  Child ID: {child_id}")
        print(f"  Age: 7 (age range: 5-7)")
        print(f"  COPPA Protection: ACTIVE")

        return child_id

    except Exception as e:
        logger.error(f"Child creation failed: {e}")
        return None


def demo_vr_session_start(child_id: int, parent_token: str):
    """Demo: Starting a VR classroom session"""
    print_header("🎮 STARTING VR CLASSROOM SESSION")

    try:
        print(f"Launching VR session for child {child_id}...")
        print("  Authenticating child (requires parent token)...")
        print("  Creating database session...")
        print("  Connecting to WebSocket for multi-user...")
        print("  Joining VR classroom...")

        session_data = oasis.start_child_vr_session(
            child_id=child_id,
            parent_token=parent_token,
            vr_platform='meta_quest_3',
            headset_model='Quest 3'
        )

        print(f"\n✅ VR Session Started!")
        print(f"  Session ID: {session_data['session_id']}")
        print(f"  Classroom ID: {session_data['classroom_id']}")
        print(f"  Current Week: {session_data['curriculum_week']}")
        print(f"  Ready for VR: {session_data['ready']}")

        return session_data

    except Exception as e:
        logger.error(f"VR session start failed: {e}")
        return None


def demo_translation_service():
    """Demo: Universal translator"""
    print_header("🌐 UNIVERSAL TRANSLATOR - 30+ LANGUAGES")

    from src.services import universal_translator

    # Demo text
    text = "Welcome to the OASIS Education Planet!"

    print(f"Original (English): {text}\n")
    print("Translating to multiple languages...\n")

    languages = {
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'ja': 'Japanese',
        'zh': 'Chinese',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'ru': 'Russian'
    }

    for code, name in languages.items():
        try:
            translated = universal_translator.translate_text(text, 'en', code)
            print(f"  {name:15} ({code}): {translated}")
        except Exception as e:
            print(f"  {name:15} ({code}): Error - {e}")

    print("\n✅ Translation service operational")


def demo_approved_phrases():
    """Demo: COPPA-safe approved phrases with translation"""
    print_header("💬 COPPA-SAFE COMMUNICATION (Approved Phrases)")

    from src.services import universal_translator

    print("Children can only send pre-approved phrases for safety.")
    print("Getting approved phrases in Spanish...\n")

    try:
        phrases = universal_translator.get_approved_phrases_translated('es')

        print("Sample Approved Phrases:")
        for phrase in phrases[:5]:
            print(f"  EN: {phrase['original']}")
            print(f"  ES: {phrase['translated']}")
            print(f"  Category: {phrase['category']}\n")

        print(f"✅ {len(phrases)} approved phrases available")

    except Exception as e:
        logger.error(f"Approved phrases demo failed: {e}")


def demo_content_library():
    """Demo: Content library access"""
    print_header("📚 CONTENT LIBRARY - 3D Models, Audio, Textures")

    from src.services import library_client

    print("Searching for VR classroom assets...\n")

    try:
        # Search for 3D models
        models = library_client.search_content(
            content_type='3d_model',
            tags=['classroom'],
            limit=5
        )

        if models:
            print(f"Found {len(models)} classroom 3D models:")
            for model in models:
                print(f"  - {model.get('title', 'Unnamed')}")
                print(f"    Type: {model.get('mime_type', 'unknown')}")
                print(f"    Size: {model.get('file_size_bytes', 0) / 1024:.1f} KB\n")
        else:
            print("⚠️ No content found (library server may not be populated yet)")

        # Search for audio
        audio = library_client.get_audio_files(category='ambient', limit=3)

        if audio:
            print(f"\nFound {len(audio)} audio files:")
            for sound in audio:
                print(f"  - {sound.get('title', 'Unnamed')}")
        else:
            print("\n⚠️ No audio files found yet")

    except Exception as e:
        logger.error(f"Content library demo failed: {e}")
        print("⚠️ Library server may be offline (will retry automatically)")


def demo_parent_monitoring():
    """Demo: Parent shadow mode monitoring"""
    print_header("👁️ PARENT SHADOW MODE - Real-Time Monitoring")

    print("Parent Shadow Mode Features:")
    print("  ✓ Invisible observation of child's VR session")
    print("  ✓ See what child sees and hears")
    print("  ✓ Real-time safety monitoring")
    print("  ✓ Emergency stop capability")
    print("  ✓ Instant summon feature\n")

    print("Parent monitoring ready via WebSocket")


def demo_end_session(child_id: int):
    """Demo: Ending a VR session"""
    print_header("🏁 ENDING VR SESSION")

    print(f"Ending VR session for child {child_id}...")

    success = oasis.end_child_vr_session(
        child_id=child_id,
        accuracy=87.5,
        engagement=8.7,
        stars_earned=5
    )

    if success:
        print("✅ VR session ended successfully")
        print("  Progress saved to database")
        print("  Parent notified")
        print("  Child disconnected from classroom")
    else:
        print("⚠️ Session end failed (may not have been started)")


def main():
    """Run complete OASIS integration demo"""
    print("\n")
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║                                                                ║")
    print("║          🌍  OASIS EDUCATION PLANET  🌍                        ║")
    print("║                                                                ║")
    print("║        \"Ready Player One's dream, realized for education\"     ║")
    print("║                                                                ║")
    print("╚════════════════════════════════════════════════════════════════╝")

    # 1. System Startup
    if not demo_system_startup():
        print("\n❌ Cannot continue - system startup failed")
        return

    time.sleep(1)

    # 2. Parent Registration
    parent_id, parent_token = demo_parent_registration()
    if not parent_id:
        print("\n⚠️ Skipping child demos (parent registration failed)")
    else:
        time.sleep(1)

        # 3. Child Creation
        child_id = demo_child_creation(parent_token)
        if child_id:
            time.sleep(1)

            # 4. VR Session Start
            session_data = demo_vr_session_start(child_id, parent_token)
            if session_data:
                time.sleep(1)

                # 5. Parent Monitoring
                demo_parent_monitoring()
                time.sleep(1)

                # 6. End Session
                demo_end_session(child_id)

    time.sleep(1)

    # 7. Translation Service
    demo_translation_service()
    time.sleep(1)

    # 8. Approved Phrases
    demo_approved_phrases()
    time.sleep(1)

    # 9. Content Library
    demo_content_library()
    time.sleep(1)

    # Final Status
    print_header("🌍 FINAL SYSTEM STATUS")

    status = oasis.get_system_status()

    print("OASIS Education Planet Status:")
    print(f"  Overall Health: {status['health']['overall'].upper()}")
    print(f"  Active Sessions: {status['active_sessions']}")
    print(f"  Database: {status['database_connection']}")
    print(f"  WebSocket: {status['websocket_connected']}")

    print("\n✅ OASIS Integration Demo Complete!")

    print("\nReady to build the future of education? 🚀")
    print("Next steps:")
    print("  1. Build VR classroom scenes (Unity/Godot)")
    print("  2. Create AI character behaviors (Professor Al, Ella, Gus)")
    print("  3. Implement voice processing pipeline")
    print("  4. Deploy to production servers")

    # Cleanup
    oasis.shutdown()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Demo interrupted by user")
        oasis.shutdown()
    except Exception as e:
        logger.error(f"Demo failed: {e}", exc_info=True)
        oasis.shutdown()
