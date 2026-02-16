"""
VR API Server Starter
Starts Flask API server for Unity VR client communication
"""

import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.api import create_api_app
from src.services import oasis
from src.core.logging_config import get_logger

logger = get_logger(__name__)


def main():
    """
    Start VR API server
    """
    print("=" * 60)
    print("🎮 EG OASIS VR API Server")
    print("=" * 60)
    print()

    # Initialize OASIS services
    print("Initializing OASIS services...")
    try:
        oasis.startup()
        print("✅ OASIS services started")
    except Exception as e:
        print(f"❌ Failed to start OASIS services: {e}")
        return

    print()

    # Create Flask app
    print("Creating API server...")
    app = create_api_app()
    print("✅ API server created")
    print()

    # Start server
    print("=" * 60)
    print("🚀 VR API Server Running")
    print("=" * 60)
    print()
    print("📡 Endpoints available at:")
    print("   http://localhost:5000/api/vr/session/start")
    print("   http://localhost:5000/api/vr/session/stop")
    print("   http://localhost:5000/api/vr/session/heartbeat")
    print("   http://localhost:5000/api/vr/curriculum/current")
    print("   http://localhost:5000/api/vr/progress/submit")
    print("   http://localhost:5000/api/vr/translation/translate")
    print("   http://localhost:5000/api/vr/status")
    print()
    print("💡 Unity client should connect to: http://localhost:5000")
    print()
    print("Press Ctrl+C to stop server")
    print("=" * 60)
    print()

    try:
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            use_reloader=False  # Disable reloader to prevent double initialization
        )
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down server...")
        print("✅ Server stopped")


if __name__ == '__main__':
    main()
