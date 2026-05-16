# OpenMe

OpenMe is an actionable bio page. Instead of only listing where someone can be found, an OpenMe profile shows what people can do with them through personal endpoints such as `/collaborate`, `/ask-me`, and `/feedback`.

The current MVP core loop is complete: a user can shape a public profile, add links, create interaction endpoints, receive public submissions, review them in an inbox, and use optional AI analysis for summaries and triage.

## Current MVP Features

- Monorepo with `apps/api`, `apps/web`, and `apps/ai-service`
- PostgreSQL schema managed with Prisma
- Seeded public demo profile
- Public profile page at `http://localhost:3000/demo`
- Public endpoint form at `http://localhost:3000/demo/collaborate`
- Visitor submission creation
- Email/password auth with HTTP-only JWT cookies
- Login and register pages at `http://localhost:3000/login` and `http://localhost:3000/register`
- Authenticated profile editor at `http://localhost:3000/dashboard/profile`
- Authenticated link editor at `http://localhost:3000/dashboard/links`
- Authenticated endpoint builder at `http://localhost:3000/dashboard/endpoints`
- Authenticated dashboard inbox at `http://localhost:3000/dashboard/inbox`
- Authenticated users can create, edit, delete, hide/show, and reorder public profile links
- Authenticated users can manage endpoint metadata, fields, boundaries, status, and order
- Dashboard navigation, homepage, empty states, and form helper copy are polished for the MVP loop
- Endpoints with submissions are archived instead of deleted so existing submissions stay safe
- Submission detail view with status updates
- Optional AI analysis with summary, intent, boundary status, priority, and suggested reply
- AI service mock mode by default
- Groq provider support when configured

If AI analysis fails or is still pending, the public submission still succeeds and the inbox can be refreshed later.

## Tech Stack

- Monorepo: pnpm workspaces + Turbo
- Web: Next.js, React, TypeScript
- API: Node.js, Express, TypeScript
- Database: PostgreSQL + Prisma
- AI service: Python, FastAPI, Pydantic, httpx
- Local infrastructure: Docker Compose

## App Structure

```text
apps/
  api/          Express API, Prisma schema, auth, profile, links, endpoints, public submission, and inbox routes
  web/          Next.js app for public pages and dashboard UI
  ai-service/   FastAPI service for mock or Groq-powered submission analysis
docs/
  architecture/ Architecture notes and runtime flow
  product/      Product scope, build order, current state, and QA docs
```

Runtime responsibility:

- `apps/web` never calls Groq.
- `apps/web` never sees `JWT_SECRET`.
- `apps/api` never calls Groq directly.
- `apps/api` calls `apps/ai-service` when `AI_ENABLED=true`.
- `apps/ai-service` calls Groq only when `AI_PROVIDER=groq` and `GROQ_API_KEY` is present.

## Environment Variables

Create a local `.env` from the example:

```bash
cp .env.example .env
```

Do not commit `.env`. `GROQ_API_KEY` and `JWT_SECRET` must stay private and must never be exposed to the frontend.

Required variables:

```bash
DATABASE_URL="postgresql://openme:openme@localhost:5432/openme_dev"
NODE_ENV="development"

WEB_URL="http://localhost:3000"
API_URL="http://localhost:4000"
NEXT_PUBLIC_API_URL="http://localhost:4000"

AI_ENABLED="false"
AI_SERVICE_URL="http://localhost:8000"

AI_PROVIDER="mock"
GROQ_API_KEY=""
GROQ_MODEL="llama-3.3-70b-versatile"
GROQ_API_URL="https://api.groq.com/openai/v1/chat/completions"

JWT_SECRET="replace_me_with_a_long_random_secret"
```

AI notes:

- `AI_PROVIDER=mock` is the default and does not use any paid API.
- `AI_PROVIDER=groq` requires `GROQ_API_KEY`.
- `AI_ENABLED=true` enables `apps/api` to call `apps/ai-service` after a public submission is created.
- Failed AI analysis is logged but never blocks submission creation.

## Install Dependencies

From the repository root:

```bash
pnpm install
```

Install Python dependencies for the AI service:

```bash
cd apps/ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

## Run Postgres

From the repository root:

```bash
docker compose up -d postgres
```

Check that the container is running:

```bash
docker compose ps
```

## Run Prisma Generate, Migrate, and Seed

From the repository root:

```bash
pnpm --filter @openme/api db:generate
pnpm --filter @openme/api db:migrate
pnpm --filter @openme/api db:seed
```

The seed creates the demo profile used by the MVP:

```text
http://localhost:3000/demo
```

It also creates a local-only demo dashboard login:

```text
email: demo@openme.local
password: password123
```

## Run apps/ai-service in Mock Mode

Mock mode is deterministic and does not call Groq.

```bash
cd apps/ai-service
source .venv/bin/activate
AI_PROVIDER=mock uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

## Run apps/ai-service in Groq Mode

Groq mode calls Groq only when `AI_PROVIDER=groq` and `GROQ_API_KEY` is set.

```bash
cd apps/ai-service
source .venv/bin/activate
AI_PROVIDER=groq \
GROQ_API_KEY="your_private_groq_key" \
GROQ_MODEL="llama-3.3-70b-versatile" \
GROQ_API_URL="https://api.groq.com/openai/v1/chat/completions" \
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Never commit the Groq key.

## Run apps/api

From the repository root, with AI disabled:

```bash
cd ~/Projects/openme
pnpm --filter @openme/api dev
```

With AI enabled:

```bash
cd ~/Projects/openme
AI_ENABLED=true AI_SERVICE_URL=http://localhost:8000 pnpm --filter @openme/api dev
```

Health check:

```bash
curl http://localhost:4000/health
```

## Run apps/web

From the repository root:

```bash
pnpm --filter @openme/web dev
```

Open:

```text
http://localhost:3000/demo
http://localhost:3000/login
http://localhost:3000/dashboard/links
http://localhost:3000/dashboard/endpoints
```

## Full Manual Flow

Use separate terminals for long-running services.

1. Start Postgres.

```bash
docker compose up -d postgres
```

2. Run migrations and seed.

```bash
pnpm --filter @openme/api db:generate
pnpm --filter @openme/api db:migrate
pnpm --filter @openme/api db:seed
```

3. Start the AI service in mock mode.

```bash
cd apps/ai-service
source .venv/bin/activate
AI_PROVIDER=mock uvicorn app.main:app --host 0.0.0.0 --port 8000
```

4. Start the API with AI enabled.

```bash
cd ~/Projects/openme
AI_ENABLED=true AI_SERVICE_URL=http://localhost:8000 pnpm --filter @openme/api dev
```

5. Start the web app.

```bash
cd ~/Projects/openme
pnpm --filter @openme/web dev
```

6. Open the demo collaboration endpoint.

```text
http://localhost:3000/demo/collaborate
```

7. Submit the form.

8. Log in as the local-only demo owner.

```text
http://localhost:3000/login
demo@openme.local / password123
```

9. Open the profile editor and update public profile fields.

```text
http://localhost:3000/dashboard/profile
```

Username editing, avatar uploads, drag-and-drop endpoint ordering, and conditional fields are not implemented yet.

10. Open the public profile and confirm saved profile fields changed.

```text
http://localhost:3000/demo
```

11. Open the link editor and manage public profile links.

```text
http://localhost:3000/dashboard/links
```

Add, edit, hide/show, reorder with Up/Down buttons, and delete a link. Confirm `/demo` reflects visible links and their order.

12. Open the endpoint builder and manage public interaction endpoints.

```text
http://localhost:3000/dashboard/endpoints
```

Create an endpoint, open its detail editor, add fields and boundaries, publish it, and confirm `/demo` reflects published public endpoints. Reordering uses Up/Down buttons for now. Archive endpoints that have submissions; delete remains available for endpoints with no submissions.

13. Open the inbox.

```text
http://localhost:3000/dashboard/inbox
```

14. Open the new submission detail page.

15. Confirm the AI analysis appears.

Analysis is fire-and-forget, so it can briefly be pending. Use the refresh action on the detail page if needed.

## Useful API Checks

```bash
curl http://localhost:4000/health
curl http://localhost:8000/health
curl http://localhost:4000/public/profiles/demo
curl http://localhost:4000/public/profiles/demo/endpoints/collaborate
curl -i -c /tmp/openme-cookies.txt \
  -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@openme.local","password":"password123"}'
curl -b /tmp/openme-cookies.txt http://localhost:4000/auth/me
curl -b /tmp/openme-cookies.txt http://localhost:4000/dashboard/profile
curl -b /tmp/openme-cookies.txt http://localhost:4000/dashboard/links
curl -b /tmp/openme-cookies.txt http://localhost:4000/dashboard/endpoints
curl -b /tmp/openme-cookies.txt http://localhost:4000/dashboard/inbox
```

Legacy demo-only inbox routes still exist for compatibility at `/dashboard/demo/inbox`, but the dashboard UI uses the authenticated owner routes.

## Build and Lint

```bash
pnpm lint
pnpm build
```
