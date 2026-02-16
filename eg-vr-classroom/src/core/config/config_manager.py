"""
Unified Configuration Manager
Loads and manages all configuration settings for EG VR Classroom
"""

import os
import yaml
from pathlib import Path
from typing import Any, Dict, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class DatabaseConfig:
    """Database configuration"""
    type: str
    host: str
    port: int
    name: str
    user: str
    password: str
    pool_size: int
    max_overflow: int
    echo: bool
    local_db_path: str


@dataclass
class ServiceConfig:
    """External service configuration"""
    enabled: bool
    url: str
    timeout: int = 30
    retry_attempts: int = 3


@dataclass
class VRConfig:
    """VR platform configuration"""
    platform: str
    target_fps: int
    enable_hand_tracking: bool
    enable_eye_tracking: bool
    enable_passthrough: bool
    comfort_settings: Dict[str, Any]


@dataclass
class SafetyConfig:
    """COPPA and safety configuration"""
    coppa_enabled: bool
    age_verification_required: bool
    parental_consent_required: bool
    session_recording: bool
    max_session_minutes: Dict[str, int]
    break_reminder_interval_minutes: int
    free_text_chat: bool
    voice_chat_supervised: bool
    private_messaging: bool
    communication_mode: str
    shadow_mode_enabled: bool
    emergency_stop_enabled: bool
    real_time_monitoring: bool


class ConfigManager:
    """
    Centralized configuration management for EG VR Classroom

    Features:
    - Environment variable substitution
    - Type-safe configuration access
    - Configuration validation
    - Hot-reload support (development)
    """

    _instance = None
    _config: Dict[str, Any] = {}
    _config_path: Optional[Path] = None

    def __new__(cls):
        """Singleton pattern"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize configuration manager"""
        if not self._config:
            self.load_config()

    @classmethod
    def load_config(cls, config_path: Optional[Path] = None) -> None:
        """
        Load configuration from YAML file

        Args:
            config_path: Path to config file (defaults to config/settings.yaml)
        """
        if config_path is None:
            # Auto-detect config path
            project_root = Path(__file__).parent.parent.parent.parent
            config_path = project_root / "config" / "settings.yaml"

        cls._config_path = config_path

        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                raw_config = yaml.safe_load(f)

            # Process environment variable substitution
            cls._config = cls._substitute_env_vars(raw_config)

            # Validate configuration
            cls._validate_config()

            logger.info(f"Configuration loaded from {config_path}")

        except FileNotFoundError:
            logger.error(f"Configuration file not found: {config_path}")
            raise
        except yaml.YAMLError as e:
            logger.error(f"Failed to parse YAML configuration: {e}")
            raise

    @classmethod
    def _substitute_env_vars(cls, config: Any) -> Any:
        """
        Recursively substitute environment variables in config

        Syntax: ${VAR_NAME} or ${VAR_NAME:default_value}
        """
        if isinstance(config, dict):
            return {k: cls._substitute_env_vars(v) for k, v in config.items()}
        elif isinstance(config, list):
            return [cls._substitute_env_vars(item) for item in config]
        elif isinstance(config, str):
            # Check for environment variable pattern
            if config.startswith("${") and config.endswith("}"):
                var_spec = config[2:-1]

                # Check for default value
                if ":" in var_spec:
                    var_name, default_value = var_spec.split(":", 1)
                    return os.getenv(var_name, default_value)
                else:
                    value = os.getenv(var_spec)
                    if value is None:
                        logger.warning(f"Environment variable {var_spec} not set")
                    return value

        return config

    @classmethod
    def _validate_config(cls) -> None:
        """Validate required configuration keys"""
        required_sections = [
            'application', 'vr', 'services', 'database',
            'auth', 'safety', 'curriculum'
        ]

        for section in required_sections:
            if section not in cls._config:
                raise ValueError(f"Missing required configuration section: {section}")

        logger.info("Configuration validation passed")

    @classmethod
    def get(cls, key_path: str, default: Any = None) -> Any:
        """
        Get configuration value using dot notation

        Args:
            key_path: Dot-separated path to config value (e.g., 'vr.target_fps')
            default: Default value if key not found

        Returns:
            Configuration value or default

        Example:
            >>> config = ConfigManager()
            >>> fps = config.get('vr.target_fps', 90)
        """
        keys = key_path.split('.')
        value = cls._config

        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default

        return value

    @classmethod
    def get_database_config(cls) -> DatabaseConfig:
        """Get database configuration as typed object"""
        db_config = cls._config.get('database', {})
        return DatabaseConfig(
            type=db_config.get('type', 'postgresql'),
            host=db_config.get('host', 'localhost'),
            port=db_config.get('port', 5432),
            name=db_config.get('name', 'elemental_genius_vr'),
            user=db_config.get('user', 'eg_user'),
            password=db_config.get('password', ''),
            pool_size=db_config.get('pool_size', 20),
            max_overflow=db_config.get('max_overflow', 10),
            echo=db_config.get('echo', False),
            local_db_path=db_config.get('local_db_path', 'data/vr_classroom_local.db')
        )

    @classmethod
    def get_vr_config(cls) -> VRConfig:
        """Get VR configuration as typed object"""
        vr_config = cls._config.get('vr', {})
        return VRConfig(
            platform=vr_config.get('platform', 'openxr'),
            target_fps=vr_config.get('target_fps', 90),
            enable_hand_tracking=vr_config.get('enable_hand_tracking', True),
            enable_eye_tracking=vr_config.get('enable_eye_tracking', False),
            enable_passthrough=vr_config.get('enable_passthrough', False),
            comfort_settings=vr_config.get('comfort_settings', {})
        )

    @classmethod
    def get_safety_config(cls) -> SafetyConfig:
        """Get safety configuration as typed object"""
        safety = cls._config.get('safety', {})
        return SafetyConfig(
            coppa_enabled=safety.get('coppa_enabled', True),
            age_verification_required=safety.get('age_verification_required', True),
            parental_consent_required=safety.get('parental_consent_required', True),
            session_recording=safety.get('session_recording', False),
            max_session_minutes=safety.get('max_session_minutes', {}),
            break_reminder_interval_minutes=safety.get('break_reminder_interval_minutes', 15),
            free_text_chat=safety.get('free_text_chat', False),
            voice_chat_supervised=safety.get('voice_chat_supervised', True),
            private_messaging=safety.get('private_messaging', False),
            communication_mode=safety.get('communication_mode', 'approved_phrases'),
            shadow_mode_enabled=safety.get('shadow_mode_enabled', True),
            emergency_stop_enabled=safety.get('emergency_stop_enabled', True),
            real_time_monitoring=safety.get('real_time_monitoring', True)
        )

    @classmethod
    def get_service_config(cls, service_name: str) -> Optional[ServiceConfig]:
        """Get service configuration by name"""
        services = cls._config.get('services', {})
        service = services.get(service_name)

        if not service:
            return None

        return ServiceConfig(
            enabled=service.get('enabled', False),
            url=service.get('url', ''),
            timeout=service.get('timeout', 30),
            retry_attempts=service.get('retry_attempts', 3)
        )

    @classmethod
    def is_feature_enabled(cls, feature_name: str) -> bool:
        """Check if a feature flag is enabled"""
        features = cls._config.get('features', {})
        return features.get(feature_name, False)

    @classmethod
    def get_environment(cls) -> str:
        """Get current environment (development, staging, production)"""
        return cls._config.get('application', {}).get('environment', 'development')

    @classmethod
    def is_debug(cls) -> bool:
        """Check if debug mode is enabled"""
        return cls._config.get('application', {}).get('debug', False)

    @classmethod
    def get_log_level(cls) -> str:
        """Get logging level"""
        return cls._config.get('application', {}).get('log_level', 'INFO')

    @classmethod
    def reload(cls) -> None:
        """Reload configuration from file (hot-reload)"""
        if cls._config_path:
            logger.info("Reloading configuration...")
            cls.load_config(cls._config_path)
        else:
            logger.warning("Cannot reload: config path not set")

    @classmethod
    def get_database_url(cls) -> str:
        """
        Get database connection URL

        Returns:
            PostgreSQL connection string
        """
        db = cls.get_database_config()
        return f"{db.type}://{db.user}:{db.password}@{db.host}:{db.port}/{db.name}"

    @classmethod
    def get_redis_url(cls) -> str:
        """
        Get Redis connection URL

        Returns:
            Redis connection string
        """
        cache = cls._config.get('cache', {})
        host = cache.get('host', 'localhost')
        port = cache.get('port', 6379)
        db = cache.get('db', 1)
        password = cache.get('password', '')

        if password:
            return f"redis://:{password}@{host}:{port}/{db}"
        return f"redis://{host}:{port}/{db}"

    @classmethod
    def get_all(cls) -> Dict[str, Any]:
        """Get entire configuration dictionary"""
        return cls._config.copy()

    def __repr__(self) -> str:
        """String representation"""
        env = self.get_environment()
        debug = self.is_debug()
        return f"<ConfigManager environment={env} debug={debug}>"


# Global singleton instance
config = ConfigManager()
