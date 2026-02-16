from typing import Optional, List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Flask Backend Compatible Database Configuration
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/elemental_genius"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 40
    
    # Redis Configuration (shared with Flask backend)
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 3600
    
    # API Configuration  
    API_VERSION: str = "v1"
    API_PREFIX: str = "/api"
    HOST: str = "0.0.0.0"
    PORT: int = 8001  # Different port from Flask backend (8000)
    RELOAD: bool = False
    LOG_LEVEL: str = "INFO"
    
    # JWT Configuration (compatible with Flask backend)
    SECRET_KEY: str = "your-super-secret-key-for-jwt-and-sessions"  # Match Flask backend
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Flask Backend Integration
    FLASK_BACKEND_URL: str = "http://localhost:8000"
    
    # Content Storage Configuration
    CONTENT_STORAGE_PATH: str = "/data/content"
    ASSETS_STORAGE_PATH: str = "/data/assets"
    
    MAX_UPLOAD_SIZE: int = 104857600
    ALLOWED_FILE_TYPES: List[str] = [".txt", ".xml", ".json", ".csv"]
    CONTENT_BASE_PATH: str = "/data/library-content"
    
    WORKERS: int = 4
    MAX_REQUESTS: int = 1000
    MAX_REQUESTS_JITTER: int = 50
    GRACEFUL_TIMEOUT: int = 30
    
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    
    PROJECT_NAME: str = "Elemental Genius Library Server"
    PROJECT_VERSION: str = "1.0.0"
    PROJECT_DESCRIPTION: str = "Educational content library server for Elemental Genius platform"
    
    CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()