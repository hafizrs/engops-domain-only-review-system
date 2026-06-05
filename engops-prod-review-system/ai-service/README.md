# EngOps AI Service (FastAPI + LangGraph)

Performance evaluation microservice. Called by NestJS — not exposed to the browser.

## Setup

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --port 8001
```

Health: http://localhost:8001/health

## Environment

| Variable | Description |
|----------|-------------|
| `AI_SERVICE_SECRET` | Shared secret with NestJS (`X-AI-Service-Secret` header) |
| `LLM_PROVIDER` | `ollama` (default, free local demo) or `azure` (paid production) |
| `OLLAMA_BASE_URL` | Ollama API URL (default `http://localhost:11434`) |
| `OLLAMA_MODEL` | Model name, e.g. `llama3.2:3b` (4GB GPU) or `llama3.2:1b` (CPU) |
| `AZURE_OPENAI_*` | Only when `LLM_PROVIDER=azure` |

### Ollama setup (free demo)

```bash
# Install from https://ollama.com then:
ollama pull llama3.2:3b    # ~4GB GPU
# ollama pull llama3.2:1b  # CPU-only alternative
```

## LangGraph pipeline

1. Load employee context + role weights  
2. Normalize dimension scores from submissions  
3. Extract evidence text  
4. Analyze 360 patterns & inconsistencies  
5. Bias / above-role / risk detection  
6. Calibrate score + performance band  
7. **AI Performance** tab (Ollama or Azure OpenAI)  
8. **AI Behavioral** tab (Ollama or Azure OpenAI)  
9. **AI Insights** tab (Ollama or Azure OpenAI)  
10. Safety validator + structured JSON output  

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/performance/evaluate` | Full evaluation (sync JSON) |
| POST | `/ai/performance/evaluate/stream` | Same pipeline via **SSE** (`text/event-stream`) |

Header: `X-AI-Service-Secret: <secret>`

**SSE events:** `started` → `node_complete` (per LangGraph step) → `section` (`performance` \| `behavioral` \| `insights`) → `complete` → or `error`

Response includes `performanceSection`, `behavioralSection`, `insightsSection` for the three review tabs.
