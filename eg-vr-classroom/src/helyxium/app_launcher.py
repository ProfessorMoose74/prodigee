"""
Helyxium App Launcher System
Manages VR app discovery, installation, and launching within Helyxium
"""

import asyncio
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
from datetime import datetime
import logging
import importlib
from pathlib import Path

logger = logging.getLogger(__name__)


class AppCategory(Enum):
    """VR app categories"""
    EDUCATION = "education"
    ENTERTAINMENT = "entertainment"
    PRODUCTIVITY = "productivity"
    SOCIAL = "social"
    SHOPPING = "shopping"
    TRAVEL = "travel"
    GAMES = "games"
    SIMULATION = "simulation"
    FITNESS = "fitness"
    CREATIVITY = "creativity"


class AppStatus(Enum):
    """App installation status"""
    NOT_INSTALLED = "not_installed"
    DOWNLOADING = "downloading"
    INSTALLING = "installing"
    INSTALLED = "installed"
    UPDATING = "updating"
    ERROR = "error"


@dataclass
class VRAppInfo:
    """Information about a VR app"""
    app_id: str
    name: str
    display_name: str
    version: str
    description: str
    developer: str
    category: AppCategory
    age_rating: str
    coppa_compliant: bool
    icon: str
    banner: str
    screenshots: List[str]
    file_size: int
    installation_path: Optional[str]
    status: AppStatus
    rating: float
    downloads: int
    last_updated: datetime
    supported_platforms: List[str]
    required_permissions: List[str]
    launch_params: Dict[str, Any]


@dataclass
class AppStore:
    """VR app store information"""
    store_id: str
    name: str
    url: str
    featured_apps: List[str]
    categories: List[AppCategory]
    is_official: bool


class HelyxiumAppLauncher:
    """
    Main app launcher for Helyxium VR platform
    Manages app discovery, installation, and launching
    """
    
    def __init__(self, helyxium_core):
        self.helyxium = helyxium_core
        
        # App management
        self.installed_apps: Dict[str, VRAppInfo] = {}
        self.available_apps: Dict[str, VRAppInfo] = {}
        self.running_apps: Dict[str, Any] = {}
        
        # App stores
        self.app_stores: Dict[str, AppStore] = {
            "official": AppStore(
                store_id="helyxium_official",
                name="Helyxium Official Store",
                url="https://store.helyxium.com",
                featured_apps=[],
                categories=list(AppCategory),
                is_official=True
            )
        }
        
        # Installation management
        self.download_queue: List[str] = []
        self.installation_progress: Dict[str, float] = {}
        
        # Discovery and recommendations
        self.user_preferences = {}
        self.recommendation_engine = None
        
    async def initialize(self):
        """Initialize the app launcher"""
        logger.info("Initializing Helyxium App Launcher")
        
        try:
            # Load installed apps
            await self._discover_installed_apps()
            
            # Connect to app stores
            await self._connect_to_app_stores()
            
            # Initialize recommendation engine
            await self._setup_recommendations()
            
            # Load featured and popular apps
            await self._load_featured_apps()
            
            logger.info(f"App launcher initialized with {len(self.installed_apps)} installed apps")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize app launcher: {e}")
            return False
    
    async def _discover_installed_apps(self):
        """Discover all installed VR apps"""
        apps_directory = Path("apps")
        
        if not apps_directory.exists():
            apps_directory.mkdir()
            return
        
        for app_path in apps_directory.iterdir():
            if app_path.is_dir():
                manifest_path = app_path / "helyxium_app_manifest.json"
                if manifest_path.exists():
                    try:
                        with open(manifest_path, 'r') as f:
                            manifest = json.load(f)
                        
                        app_info = await self._create_app_info_from_manifest(
                            manifest, str(app_path)
                        )
                        
                        self.installed_apps[app_info.app_id] = app_info
                        
                    except Exception as e:
                        logger.error(f"Failed to load app manifest {manifest_path}: {e}")
    
    async def _create_app_info_from_manifest(self, manifest: Dict, install_path: str) -> VRAppInfo:
        """Create VRAppInfo from manifest data"""
        app_info = manifest.get("app_info", {})
        
        return VRAppInfo(
            app_id=app_info.get("app_id"),
            name=app_info.get("name"),
            display_name=app_info.get("display_name", app_info.get("name")),
            version=app_info.get("version"),
            description=app_info.get("description", ""),
            developer=app_info.get("developer", "Unknown"),
            category=AppCategory(app_info.get("category", "entertainment")),
            age_rating=app_info.get("age_rating", "E"),
            coppa_compliant=app_info.get("coppa_compliant", False),
            icon=app_info.get("icon", ""),
            banner=app_info.get("banner", ""),
            screenshots=app_info.get("screenshots", []),
            file_size=0,  # Would calculate actual size
            installation_path=install_path,
            status=AppStatus.INSTALLED,
            rating=4.5,  # Would fetch from store
            downloads=0,  # Would fetch from store
            last_updated=datetime.now(),
            supported_platforms=list(manifest.get("helyxium_integration", {}).get("platform_support", {}).keys()),
            required_permissions=manifest.get("permissions", {}).get("required", []),
            launch_params=manifest.get("launch_configuration", {})
        )
    
    async def _connect_to_app_stores(self):
        """Connect to available app stores"""
        for store in self.app_stores.values():
            try:
                # In production, this would connect to actual app stores
                logger.info(f"Connected to app store: {store.name}")
            except Exception as e:
                logger.error(f"Failed to connect to {store.name}: {e}")
    
    async def _setup_recommendations(self):
        """Initialize app recommendation system"""
        # This would initialize ML models for app recommendations
        pass
    
    async def _load_featured_apps(self):
        """Load featured and popular apps"""
        # Example featured VR experiences
        featured_apps = [
            {
                "app_id": "elemental_genius_vr_classroom",
                "featured_reason": "Safe education for children"
            },
            {
                "app_id": "vr_shopping_mall", 
                "featured_reason": "Virtual shopping experience"
            },
            {
                "app_id": "space_station_simulator",
                "featured_reason": "Explore space in VR"
            },
            {
                "app_id": "virtual_museum",
                "featured_reason": "World-class art and history"
            },
            {
                "app_id": "meditation_garden",
                "featured_reason": "Relaxation and mindfulness"
            }
        ]
        
        for app in featured_apps:
            # In production, load from actual app store
            pass
    
    async def get_app_library(self, user_id: str = None) -> Dict[str, List[VRAppInfo]]:
        """Get user's app library organized by category"""
        library = {
            "installed": list(self.installed_apps.values()),
            "recently_played": [],
            "favorites": [],
            "recommended": await self._get_recommended_apps(user_id)
        }
        
        # Organize by category
        by_category = {}
        for category in AppCategory:
            by_category[category.value] = [
                app for app in library["installed"] 
                if app.category == category
            ]
        
        library["by_category"] = by_category
        return library
    
    async def _get_recommended_apps(self, user_id: str) -> List[VRAppInfo]:
        """Get personalized app recommendations"""
        # This would use ML to recommend apps based on user behavior
        recommendations = []
        
        # Mock recommendations based on categories
        if user_id:
            # Get user preferences
            preferences = self.user_preferences.get(user_id, {})
            preferred_categories = preferences.get("categories", ["education", "entertainment"])
            
            for app in self.available_apps.values():
                if app.category.value in preferred_categories and app.rating >= 4.0:
                    recommendations.append(app)
        
        return recommendations[:10]
    
    async def search_apps(self, query: str, category: Optional[AppCategory] = None,
                         age_appropriate: bool = False) -> List[VRAppInfo]:
        """Search for VR apps"""
        results = []
        
        # Search in installed apps
        for app in self.installed_apps.values():
            if self._matches_search(app, query, category, age_appropriate):
                results.append(app)
        
        # Search in available apps
        for app in self.available_apps.values():
            if self._matches_search(app, query, category, age_appropriate):
                results.append(app)
        
        # Sort by relevance and rating
        results.sort(key=lambda x: (x.rating, x.downloads), reverse=True)
        
        return results
    
    def _matches_search(self, app: VRAppInfo, query: str, 
                       category: Optional[AppCategory], age_appropriate: bool) -> bool:
        """Check if app matches search criteria"""
        # Text search
        query_lower = query.lower()
        if query_lower not in app.name.lower() and query_lower not in app.description.lower():
            return False
        
        # Category filter
        if category and app.category != category:
            return False
        
        # Age appropriate filter
        if age_appropriate and not app.coppa_compliant:
            return False
        
        return True
    
    async def install_app(self, app_id: str, user_id: str) -> bool:
        """Install a VR app"""
        if app_id in self.installed_apps:
            logger.info(f"App {app_id} is already installed")
            return True
        
        if app_id not in self.available_apps:
            logger.error(f"App {app_id} not found in available apps")
            return False
        
        try:
            app_info = self.available_apps[app_id]
            
            # Check permissions
            if not await self._check_app_permissions(app_info, user_id):
                logger.warning(f"Permission denied for app {app_id}")
                return False
            
            # Start download
            app_info.status = AppStatus.DOWNLOADING
            self.download_queue.append(app_id)
            
            # Simulate download progress
            asyncio.create_task(self._download_app(app_id))
            
            logger.info(f"Started installing app {app_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to install app {app_id}: {e}")
            return False
    
    async def _check_app_permissions(self, app_info: VRAppInfo, user_id: str) -> bool:
        """Check if user can install the app"""
        user_account = await self.helyxium.get_user_account(user_id)
        
        # Age restrictions
        if app_info.age_rating == "T" and user_account.age < 13:
            return False
        
        if app_info.age_rating == "M" and user_account.age < 17:
            return False
        
        # COPPA compliance for children
        if user_account.age < 13 and not app_info.coppa_compliant:
            return False
        
        # Parent permission for children
        if user_account.account_type == "child":
            return await self._get_parent_permission(user_id, app_info.app_id)
        
        return True
    
    async def _get_parent_permission(self, child_id: str, app_id: str) -> bool:
        """Get parent permission for app installation"""
        # This would integrate with the parent control system
        # For now, assume permission is granted
        return True
    
    async def _download_app(self, app_id: str):
        """Simulate app download process"""
        try:
            app_info = self.available_apps[app_id]
            
            # Simulate download progress
            for progress in range(0, 101, 10):
                self.installation_progress[app_id] = progress / 100.0
                await asyncio.sleep(0.5)  # Simulate download time
            
            # Move to installation phase
            app_info.status = AppStatus.INSTALLING
            await asyncio.sleep(2)  # Simulate installation
            
            # Complete installation
            app_info.status = AppStatus.INSTALLED
            app_info.installation_path = f"apps/{app_id}"
            
            # Move to installed apps
            self.installed_apps[app_id] = app_info
            
            logger.info(f"Successfully installed app {app_id}")
            
        except Exception as e:
            logger.error(f"Failed to download app {app_id}: {e}")
            if app_id in self.available_apps:
                self.available_apps[app_id].status = AppStatus.ERROR
    
    async def launch_app(self, app_id: str, user_id: str, 
                        launch_params: Optional[Dict] = None) -> bool:
        """Launch a VR app"""
        if app_id not in self.installed_apps:
            logger.error(f"App {app_id} is not installed")
            return False
        
        if app_id in self.running_apps:
            logger.info(f"App {app_id} is already running")
            return True
        
        try:
            app_info = self.installed_apps[app_id]
            
            # Load app module
            app_module = await self._load_app_module(app_info)
            if not app_module:
                return False
            
            # Create app context
            app_context = await self._create_app_context(user_id, app_info, launch_params)
            
            # Initialize and launch app
            app_instance = app_module.create_app()
            
            success = await app_instance.on_initialize(app_context)
            if not success:
                logger.error(f"Failed to initialize app {app_id}")
                return False
            
            success = await app_instance.on_launch(app_context, launch_params or {})
            if not success:
                logger.error(f"Failed to launch app {app_id}")
                return False
            
            # Track running app
            self.running_apps[app_id] = app_instance
            
            logger.info(f"Successfully launched app {app_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to launch app {app_id}: {e}")
            return False
    
    async def _load_app_module(self, app_info: VRAppInfo):
        """Dynamically load app module"""
        try:
            # Get entry point from launch configuration
            entry_point = app_info.launch_params.get("entry_point")
            if not entry_point:
                logger.error(f"No entry point defined for app {app_info.app_id}")
                return None
            
            # Parse module path
            module_path, class_name = entry_point.split(":")
            
            # Import module
            spec = importlib.util.spec_from_file_location(
                f"app_{app_info.app_id}",
                Path(app_info.installation_path) / module_path.replace(".", "/") + ".py"
            )
            
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            return module
            
        except Exception as e:
            logger.error(f"Failed to load app module {app_info.app_id}: {e}")
            return None
    
    async def _create_app_context(self, user_id: str, app_info: VRAppInfo, 
                                 launch_params: Optional[Dict]):
        """Create application context"""
        from helyxium_sdk import AppContext
        
        user_account = await self.helyxium.get_user_account(user_id)
        
        context = AppContext(
            helyxium_core=self.helyxium,
            app_info=app_info,
            user=user_account,
            launch_parameters=launch_params or {}
        )
        
        return context
    
    async def close_app(self, app_id: str) -> bool:
        """Close a running app"""
        if app_id not in self.running_apps:
            return True
        
        try:
            app_instance = self.running_apps[app_id]
            context = app_instance.context
            
            await app_instance.on_shutdown(context)
            
            del self.running_apps[app_id]
            
            logger.info(f"Closed app {app_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to close app {app_id}: {e}")
            return False
    
    async def get_running_apps(self) -> List[Dict[str, Any]]:
        """Get list of currently running apps"""
        running = []
        
        for app_id, app_instance in self.running_apps.items():
            app_info = self.installed_apps[app_id]
            running.append({
                "app_id": app_id,
                "name": app_info.name,
                "icon": app_info.icon,
                "running_time": "00:15:30",  # Would calculate actual time
                "status": "active"
            })
        
        return running
    
    async def get_app_categories(self) -> List[Dict[str, Any]]:
        """Get app categories with counts"""
        categories = []
        
        for category in AppCategory:
            count = sum(1 for app in self.installed_apps.values() 
                       if app.category == category)
            
            categories.append({
                "id": category.value,
                "name": category.value.replace("_", " ").title(),
                "icon": f"category_{category.value}.png",
                "app_count": count,
                "featured_apps": []  # Would populate with featured apps
            })
        
        return categories
    
    async def uninstall_app(self, app_id: str, user_id: str) -> bool:
        """Uninstall a VR app"""
        if app_id not in self.installed_apps:
            return True
        
        try:
            # Close app if running
            if app_id in self.running_apps:
                await self.close_app(app_id)
            
            app_info = self.installed_apps[app_id]
            
            # Remove installation files
            import shutil
            if app_info.installation_path and Path(app_info.installation_path).exists():
                shutil.rmtree(app_info.installation_path)
            
            # Remove from installed apps
            del self.installed_apps[app_id]
            
            logger.info(f"Uninstalled app {app_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to uninstall app {app_id}: {e}")
            return False
    
    async def update_app(self, app_id: str) -> bool:
        """Update an installed app"""
        if app_id not in self.installed_apps:
            return False
        
        try:
            app_info = self.installed_apps[app_id]
            app_info.status = AppStatus.UPDATING
            
            # Check for updates (would connect to app store)
            # Download and install update
            # Update app info
            
            app_info.status = AppStatus.INSTALLED
            logger.info(f"Updated app {app_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update app {app_id}: {e}")
            return False
    
    async def get_app_details(self, app_id: str) -> Optional[VRAppInfo]:
        """Get detailed information about an app"""
        if app_id in self.installed_apps:
            return self.installed_apps[app_id]
        elif app_id in self.available_apps:
            return self.available_apps[app_id]
        else:
            return None