from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ai_service_secret: str = "dev-ai-secret"
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment_name: str = "gpt-4o"
    azure_openai_api_version: str = "2024-08-01-preview"
    log_level: str = "INFO"

    @property
    def azure_configured(self) -> bool:
        return bool(
            self.azure_openai_endpoint
            and self.azure_openai_api_key
            and self.azure_openai_deployment_name
        )

    def require_azure(self) -> None:
        missing = []
        if not self.azure_openai_endpoint:
            missing.append("AZURE_OPENAI_ENDPOINT")
        if not self.azure_openai_api_key:
            missing.append("AZURE_OPENAI_API_KEY")
        if not self.azure_openai_deployment_name:
            missing.append("AZURE_OPENAI_DEPLOYMENT_NAME")
        if missing:
            raise RuntimeError(
                "Azure OpenAI is required. Set in ai-service/.env: " + ", ".join(missing)
            )


settings = Settings()
