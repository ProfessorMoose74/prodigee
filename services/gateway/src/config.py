"""Gateway service configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "development"
    project_id: str = "prodigee-488119"

    # Internal service URLs (Cloud Run service-to-service)
    auth_service_url: str = "http://localhost:8081"
    learning_service_url: str = "http://localhost:8082"
    analytics_service_url: str = "http://localhost:8083"
    ar_vr_service_url: str = "http://localhost:8084"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60

    # Proxy
    request_timeout_seconds: float = 30.0

    model_config = {"env_prefix": "GATEWAY_"}


settings = Settings()
