"""Learning engine service configuration."""

from pydantic_settings import BaseSettings

_DEFAULT_CORS = ["http://localhost:3000", "http://localhost:5173"]
_PRODUCTION_CORS = [
    "https://getprodigee.com",
    "https://www.getprodigee.com",
    "https://getprodigee.net",
    "https://www.getprodigee.net",
]


class Settings(BaseSettings):
    environment: str = "development"
    project_id: str = "prodigee-488119"
    region: str = "us-east1"

    # JWT (shared secret with auth service for local token decoding)
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"

    # Vertex AI
    vertex_ai_model: str = "gemini-2.0-flash"

    # Cloud Speech
    speech_language_code: str = "en-US"
    speech_sample_rate: int = 16000

    # Cloud Translation
    translation_default_language: str = "en"

    # Cloud Storage
    content_bucket: str = "prodigee-content"
    media_bucket: str = "prodigee-media"

    # CORS
    cors_origins: list[str] = _DEFAULT_CORS

    model_config = {"env_prefix": "LEARNING_"}


def _build_settings() -> Settings:
    s = Settings()
    if s.environment == "production":
        s.cors_origins = _PRODUCTION_CORS
    return s


settings = _build_settings()
