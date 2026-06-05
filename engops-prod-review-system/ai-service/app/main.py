import logging

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.config import settings
from app.graph.workflow import format_sse, run_evaluation, stream_evaluation
from app.models import EvaluateRequest
from app.security import verify_ai_secret

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

app = FastAPI(title="EngOps AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_check():
    if settings.llm_provider == "azure":
        if not settings.azure_configured:
            logger.error(
                "Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT, "
                "AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_NAME in .env"
            )
        else:
            logger.info("Azure OpenAI configured (deployment=%s)", settings.azure_openai_deployment_name)
    else:
        if settings.ollama_reachable():
            logger.info("Ollama ready at %s (model=%s)", settings.ollama_base_url, settings.ollama_model)
        else:
            logger.warning(
                "Ollama not reachable at %s. Run: ollama pull %s",
                settings.ollama_base_url,
                settings.ollama_model,
            )


def _llm_unavailable_detail() -> str:
    if settings.llm_provider == "azure":
        return (
            "Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT, "
            "AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_NAME."
        )
    return (
        f"Ollama is not running at {settings.ollama_base_url}. "
        f"Install Ollama, then run: ollama pull {settings.ollama_model}"
    )


@app.get("/health")
def health():
    return {
        "status": "ok" if settings.llm_configured else "degraded",
        "llmProvider": settings.llm_provider,
        "ollamaRunning": settings.ollama_reachable() if settings.llm_provider == "ollama" else None,
        "ollamaModel": settings.ollama_model if settings.llm_provider == "ollama" else None,
        "ollamaModelReady": settings.ollama_model_available() if settings.llm_provider == "ollama" else None,
        "azureConfigured": settings.azure_configured if settings.llm_provider == "azure" else None,
    }


@app.post("/ai/performance/evaluate", dependencies=[Depends(verify_ai_secret)])
def evaluate_performance(body: EvaluateRequest) -> dict:
    if not settings.llm_configured:
        raise HTTPException(status_code=503, detail=_llm_unavailable_detail())
    logger.info(
        "Evaluate %s (%s) submissions=%s provider=%s",
        body.employee.revieweeName,
        body.employee.revieweeEmail,
        len(body.submissions),
        settings.llm_provider,
    )
    try:
        payload = body.model_dump()
        return run_evaluation(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/ai/performance/evaluate/stream", dependencies=[Depends(verify_ai_secret)])
def evaluate_performance_stream(body: EvaluateRequest):
    if not settings.llm_configured:
        raise HTTPException(status_code=503, detail=_llm_unavailable_detail())

    payload = body.model_dump()

    def event_stream():
        try:
            for event in stream_evaluation(payload):
                yield format_sse(event)
                if event.get("event") == "error":
                    break
        except Exception as exc:
            yield format_sse({"event": "error", "message": str(exc)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
