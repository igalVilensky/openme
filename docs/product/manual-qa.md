# Manual QA Checklist

Use this checklist before merging MVP changes. Run commands from the repository root unless noted otherwise.

## Setup Checks

- Install dependencies.

```bash
pnpm install
```

- Create a local environment file.

```bash
cp .env.example .env
```

- Confirm `.env` is not committed.

```bash
git status --short
```

- Start Postgres.

```bash
docker compose up -d postgres
docker compose ps
```

- Generate Prisma client, run migrations, and seed demo data.

```bash
pnpm --filter @openme/api db:generate
pnpm --filter @openme/api db:migrate
pnpm --filter @openme/api db:seed
```

Expected: seed logs the public demo profile and the local-only demo login:

```text
demo@openme.local / password123
```

## API Health Checks

- Start the API.

```bash
pnpm --filter @openme/api dev
```

- Check API health.

```bash
curl http://localhost:4000/health
```

Expected: `{"status":"ok"}`.

## Auth Checks

- Confirm unauthenticated dashboard access is rejected.

```bash
curl -i http://localhost:4000/auth/me
curl -i http://localhost:4000/dashboard/inbox
```

Expected: HTTP 401.

- Log in as the local-only demo user and save cookies.

```bash
curl -i -c /tmp/openme-cookies.txt \
  -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@openme.local","password":"password123"}'
```

Expected: HTTP 200, a `Set-Cookie` header, and a user/profile summary for `demo`.

- Fetch the current user with the saved cookie.

```bash
curl -b /tmp/openme-cookies.txt http://localhost:4000/auth/me
```

Expected: profile username is `demo`.

- Register a new local account.

```bash
curl -i -c /tmp/openme-register-cookies.txt \
  -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"qa@example.com","password":"password123","username":"qa-user","displayName":"QA User"}'
```

Expected: HTTP 201, a `Set-Cookie` header, and a public profile summary for `qa-user`.

- Log out.

```bash
curl -i -b /tmp/openme-cookies.txt -c /tmp/openme-cookies.txt \
  -X POST http://localhost:4000/auth/logout
```

Expected: HTTP 200 and the auth cookie is cleared.

## AI Service Health Checks

- Install AI service dependencies if needed.

```bash
cd apps/ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

- Start AI service in mock mode.

```bash
cd apps/ai-service
source .venv/bin/activate
AI_PROVIDER=mock uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- Check AI service health.

```bash
curl http://localhost:8000/health
```

Expected: provider is `mock` and `groqConfigured` is `false` unless a key is configured.

## Public Profile Checks

- Fetch the seeded demo profile.

```bash
curl http://localhost:4000/public/profiles/demo
```

- Confirm the response includes:

```text
username: demo
displayName: Demo User
endpoints including collaborate, ask-me, and feedback
```

- Open the public profile in the browser.

```text
http://localhost:3000/demo
```

## Public Endpoint Form Checks

- Fetch the collaborate endpoint config.

```bash
curl http://localhost:4000/public/profiles/demo/endpoints/collaborate
```

- Open the collaborate form in the browser.

```text
http://localhost:3000/demo/collaborate
```

- Confirm the form shows seeded fields and boundaries.

## Submission Validation Checks

- Submit an invalid empty payload.

```bash
curl -i \
  -X POST http://localhost:4000/public/profiles/demo/endpoints/collaborate/submissions \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: HTTP 400 validation error.

- Submit the browser form with required fields filled.

Expected: success response in the UI and a new inbox item.

## Inbox Checks

- Fetch the authenticated owner inbox with the demo login cookie.

```bash
curl -b /tmp/openme-cookies.txt http://localhost:4000/dashboard/inbox
```

- Open the inbox in the browser.

```text
http://localhost:3000/dashboard/inbox
```

- If prompted, log in with `demo@openme.local` / `password123`.

- Confirm the new submission appears near the top.

- Open a submission detail page from the inbox.

Expected: submitter info, message, endpoint fields, answers, and current status are visible.

## Status Update Checks

- Pick a submission ID from the inbox response.

- Update status to `REVIEWED`.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X PATCH http://localhost:4000/dashboard/inbox/SUBMISSION_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status":"REVIEWED"}'
```

- Refresh the inbox detail page.

Expected: status is updated.

- Optionally confirm the legacy demo-only route still works for compatibility.

```bash
curl http://localhost:4000/dashboard/demo/inbox
```

Valid statuses:

```text
NEW
REVIEWED
REPLIED
ARCHIVED
BLOCKED
```

## AI Analysis Checks

- Start AI service in mock mode.

```bash
cd apps/ai-service
source .venv/bin/activate
AI_PROVIDER=mock uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- Start API with AI enabled.

```bash
cd ~/Projects/openme
AI_ENABLED=true AI_SERVICE_URL=http://localhost:8000 pnpm --filter @openme/api dev
```

- Submit a new form at:

```text
http://localhost:3000/demo/collaborate
```

- Open the new submission detail page.

Expected: analysis appears with summary, intent, boundary status, priority, and suggested reply.

- If analysis is missing immediately, refresh after a moment.

Expected: submission exists even if analysis is delayed.

## Groq Mode Checks

- Start AI service with Groq mode.

```bash
cd apps/ai-service
source .venv/bin/activate
AI_PROVIDER=groq \
GROQ_API_KEY="your_private_groq_key" \
GROQ_MODEL="llama-3.3-70b-versatile" \
GROQ_API_URL="https://api.groq.com/openai/v1/chat/completions" \
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- Check AI service health.

```bash
curl http://localhost:8000/health
```

Expected: provider is `groq` and `groqConfigured` is `true`.

- Submit a new public form while the API is running with AI enabled.

Expected: analysis is created. If Groq fails or returns invalid output, the AI service falls back to mock analysis and the submission still succeeds.

## Regression Checklist Before Every Commit

- Confirm no secrets are staged.

```bash
git status --short
git diff --cached
```

- Run API typecheck.

```bash
pnpm --filter @openme/api lint
```

- Run web lint.

```bash
pnpm --filter @openme/web lint
```

- Run a full manual submission flow:

```text
/demo/collaborate -> submit form -> /login -> /dashboard/inbox -> open detail
```

- Confirm logged-out dashboard pages show a login prompt or redirect path.

- Confirm public submission creation still succeeds when AI service is stopped.

- Confirm inbox detail naturally shows analysis when it exists.
