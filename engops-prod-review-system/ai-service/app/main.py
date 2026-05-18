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
    if not settings.azure_configured:
        logger.error(
            "Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT, "
            "AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_NAME in .env"
        )
    else:
        logger.info("Azure OpenAI configured (deployment=%s)", settings.azure_openai_deployment_name)


@app.get("/health")
def health():
    return {
        "status": "ok" if settings.azure_configured else "degraded",
        "azureConfigured": settings.azure_configured,
    }


@app.post("/ai/performance/evaluate", dependencies=[Depends(verify_ai_secret)])
def evaluate_performance(body: EvaluateRequest) -> dict:
    if not settings.azure_configured:
        raise HTTPException(
            status_code=503,
            detail="Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_NAME.",
        )
    logger.info(
        "Evaluate %s (%s) submissions=%s",
        body.employee.revieweeName,
        body.employee.revieweeEmail,
        len(body.submissions),
    )
    try:
        payload = body.model_dump()
        return run_evaluation(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/ai/performance/evaluate/stream", dependencies=[Depends(verify_ai_secret)])
def evaluate_performance_stream(body: EvaluateRequest):
    if not settings.azure_configured:
        raise HTTPException(
            status_code=503,
            detail="Azure OpenAI is not configured. Set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_NAME.",
        )

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
