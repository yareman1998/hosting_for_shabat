from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Application settings loaded exclusively from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str

    # JWT / Security
    JWT_SECRET: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # Admin credentials
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    # Hugging Face Inference API (embedding model)
    HF_ACCESS_TOKEN: str | None = None
    HF_MODEL: str | None = None

    # LangSmith / LangChain Tracing
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: str | None = None
    LANGCHAIN_PROJECT: str = "hosting-for-shabat"


settings = Settings()
