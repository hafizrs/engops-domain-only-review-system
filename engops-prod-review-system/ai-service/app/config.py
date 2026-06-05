import httpx
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ai_service_secret: str = "dev-ai-secret"
    log_level: str = "INFO"

    # --- Demo / local LLM (default: Ollama — free, runs on CPU or ~4GB GPU) ---
    llm_provider: str = "ollama"  # "ollama" | "azure"
    ollama_base_url: str = "http://localhost:11434"
    # RTX 3050 4GB: llama3.2:3b on GPU; llama3.2:1b if VRAM tight
    ollama_model: str = "llama3.2:3b"
    ollama_timeout_seconds: int = 600
    ollama_fallback_on_error: bool = True
    # -1 = offload all layers to GPU (needs Ollama 0.3+ with NVIDIA drivers)
    ollama_num_gpu: int = -1
    ollama_num_ctx: int = 2048
    ollama_num_predict: int = 1024
    # Insights JSON is largest; needs more output tokens (512 truncates mid-string)
    ollama_num_predict_insights: int = 1536

    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment_name: str = "gpt-4o"
    azure_openai_api_version: str = "2024-08-01-preview"

    @property
    def azure_configured(self) -> bool:
        return bool(
            self.azure_openai_endpoint
            and self.azure_openai_api_key
            and self.azure_openai_deployment_name
        )

    def _ollama_installed_models(self) -> list[str]:
        try:
            r = httpx.get(f"{self.ollama_base_url.rstrip('/')}/api/tags", timeout=3.0)
            if r.status_code != 200:
                return []
            names = [m.get("name", "") for m in r.json().get("models", [])]
            # tags include "llama3.2:3b" and sometimes "llama3.2:3b:latest"
            return [n.split(":")[0] if ":" in n else n for n in names] + names
        except Exception:
            return []

    def ollama_model_available(self) -> bool:
        want = self.ollama_model
        want_base = want.split(":")[0]
        installed = self._ollama_installed_models()
        return any(
            m == want or m.startswith(f"{want}:") or m == want_base or m.startswith(f"{want_base}:")
            for m in installed
        )

    def ollama_reachable(self) -> bool:
        return bool(self._ollama_installed_models())

    @property
    def llm_configured(self) -> bool:
        if self.llm_provider == "azure":
            return self.azure_configured
        return self.ollama_reachable() and self.ollama_model_available()

    def require_llm(self) -> None:
        if self.llm_provider == "azure":
            self._require_azure()
            return
        if not self.ollama_reachable():
            raise RuntimeError(
                f"Ollama is not running at {self.ollama_base_url}. "
                f"Install from https://ollama.com, then run: ollama pull {self.ollama_model}"
            )
        if not self.ollama_model_available():
            raise RuntimeError(
                f"Ollama model '{self.ollama_model}' is not installed. Run: ollama pull {self.ollama_model}"
            )

    def _require_azure(self) -> None:
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
