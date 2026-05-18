# EngOps Review System - Local Run

This version uses simple domain matching only.

No Docker MongoDB is required.
No Azure Client ID is required.
No Microsoft SSO is required.

Any email ending with `@selisegroup.com` can login and will be automatically stored in MongoDB.

## 1. Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

Backend runs on:

```text
http://localhost:4000
```

Default `.env` MongoDB:

```env
MONGODB_URI=mongodb://10.30.65.4:27017/engops-review-system?retryWrites=false&loadBalanced=false&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000
ALLOWED_EMAIL_DOMAIN=selisegroup.com
```

## 2. Frontend setup

Open another terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## 3. Test flow

1. Login as admin:

```text
admin@selisegroup.com
```

Select role: `Admin`.

2. Create a review form.

Required fields:

- Reviewer name
- Reviewer email
- Reviewee name
- Reviewee email

3. Copy the generated review link.

4. Logout.

5. Login as reviewer email.

6. Open the review link and submit.

7. Login as admin and check submissions.

## 4. AI service (LangGraph + FastAPI)

Third terminal:

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Add to `backend/.env`:

```env
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_SECRET=dev-ai-secret-change-me
```

Match the same secret in `ai-service/.env`. Set `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, and `AZURE_OPENAI_DEPLOYMENT_NAME` — summaries require Azure OpenAI.

### AI evaluation API (admin JWT) — matches the AI Evaluation UI

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ai-evaluations/health` | Nest → AI service connectivity |
| POST | `/api/ai-evaluations/run` | `revieweeName`, `revieweeEmail`, `formIds[]`, optional `dateFrom` / `dateTo` |
| GET | `/api/ai-evaluations/:id` | Get stored evaluation |
| POST | `/api/ai-evaluations/:id/approve` | Manager approve |

No review-cycle APIs yet — the frontend scopes evaluation by **selected forms + date range**, not by a named cycle.

Frontend **AI Evaluation** loads review forms and submissions from the API, runs `POST /ai-evaluations/run` to generate drafts, and `POST /ai-evaluations/:id/approve` when the manager approves.

## Important security note

Domain-only matching is okay for internal POC/local testing, but it does not prove the user owns the mailbox. For production, use Microsoft SSO or Email OTP.
