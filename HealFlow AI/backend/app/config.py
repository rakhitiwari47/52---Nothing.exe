import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    APP_NAME: str = "HealFlow AI"
    APP_ENV: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # Database
    DATABASE_URL: str = Field(default="sqlite:///./healflow.db")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    
    # AI Engine
    AI_PROVIDER: str = "gemini"  # gemini, openai, or fallback
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # Recovery and Safety limits
    MAX_RECOVERY_RETRIES: int = 3
    RECOVERY_TIMEOUT_SECONDS: int = 10
    DEMO_MODE: bool = True

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

    @property
    def clean_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    @property
    def is_ai_configured(self) -> bool:
        if self.GEMINI_API_KEY and len(self.GEMINI_API_KEY.strip()) > 5:
            return True
        if self.OPENAI_API_KEY and len(self.OPENAI_API_KEY.strip()) > 5:
            return True
        return False

    @property
    def active_ai_provider(self) -> str:
        if self.GEMINI_API_KEY and len(self.GEMINI_API_KEY.strip()) > 5:
            return "Google Gemini API"
        if self.OPENAI_API_KEY and len(self.OPENAI_API_KEY.strip()) > 5:
            return "OpenAI API"
        return "Deterministic Fallback Rules Engine"


settings = Settings()
