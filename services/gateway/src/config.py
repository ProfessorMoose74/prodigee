"""Gateway service configuration."""

from pydantic_settings import BaseSettings

_DEFAULT_CORS = ["http://localhost:3000", "http://localhost:5173"]
_PRODUCTION_CORS = [
    "https://getprodigee.com",
    "https://www.getprodigee.com",
    "https://getprodigee.net",
    "https://www.getprodigee.net",
    "https://prodigee-488119.web.app",
    "https://prodigee-488119.firebaseapp.com",
]


class Settings(BaseSettings):
    environment: str = "development"
    project_id: str = "prodigee-488119"

    # Internal service URLs (Cloud Run service-to-service)
    auth_service_url: str = "http://localhost:8081"
    learning_service_url: str = "http://localhost:8082"
    analytics_service_url: str = "http://localhost:8083"
    ar_vr_service_url: str = "http://localhost:8084"

    # CORS
    cors_origins: list[str] = _DEFAULT_CORS

    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60

    # Proxy
    request_timeout_seconds: float = 30.0

    model_config = {"env_prefix": "GATEWAY_"}


def _build_settings() -> Settings:
    s = Settings()
    if s.environment == "production":
        s.cors_origins = _PRODUCTION_CORS
    return s


settings = _build_settings()
