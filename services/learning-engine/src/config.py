"""Learning engine service configuration."""

from pydantic_settings import BaseSettings


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
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    model_config = {"env_prefix": "LEARNING_"}


settings = Settings()
