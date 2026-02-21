"""Analytics service configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "development"
    project_id: str = "prodigee-488119"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    model_config = {"env_prefix": "ANALYTICS_"}


settings = Settings()
