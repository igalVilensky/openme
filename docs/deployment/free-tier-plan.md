# Free-Tier Deployment Plan

This plan prepares OpenMe for a no-paid-services deployment. It does not add
provider config files or deploy anything.

## Recommended Free-Tier Architecture

- `apps/web`: Vercel for the Next.js frontend.
- Database: Neon or Supabase free Postgres.
- `apps/api`: Render, Fly.io, or a Railway-like free option for the Express API.
- `apps/ai-service`: Render, Fly.io, Hugging Face Spaces, or postpone it and keep
  AI disabled first.
- Groq API key: set only on `apps/ai-service`, never on `apps/web`.

## Service-by-Service Deployment

### Web

Deploy `apps/web` as the Next.js app.

- Build command: `pnpm --filter @openme/web build`
- Start command: `pnpm --filter @openme/web start`
- Required public env: `NEXT_PUBLIC_API_URL`

`NEXT_PUBLIC_API_URL` is baked into the browser bundle at build time. Set it to
the deployed API URL before building.

### API

Deploy `apps/api` as the Express service.

- Build command: `pnpm --filter @openme/api build`
- Start command: `pnpm --filter @openme/api start`
- Health check: `GET /health`

Run Prisma migrations against the production database before starting or
restarting the API.

### AI Service

Deploy `apps/ai-service` only when AI analysis is needed.

- Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Health check: `GET /health`

The API can run with `AI_ENABLED=false`, so the first deployment can postpone
this service entirely.

## Environment Variables Per Service

### Web

- `NEXT_PUBLIC_API_URL`: deployed API URL. This is safe to expose because it is
  the public browser target for API requests.

### API

- `NODE_ENV=production`
- `DATABASE_URL`: production Postgres URL from Neon, Supabase, or another free
  Postgres provider.
- `WEB_URL`: deployed frontend URL. The API uses this as the allowed CORS origin.
- `API_URL`: deployed API URL, used for documentation and operational clarity.
- `JWT_SECRET`: long random production secret.
- `AI_ENABLED=false` for the first deploy, or `true` if the AI service is live.
- `AI_SERVICE_URL`: deployed AI service URL when `AI_ENABLED=true`.
- `AI_SERVICE_TOKEN`: optional shared secret for API-to-AI-service requests.

Do not set `GROQ_API_KEY` on the API. The API calls the AI service, not Groq.
If the AI service is deployed publicly, set the same `AI_SERVICE_TOKEN` on the
API and AI service. Never expose this token to `apps/web`.

### AI Service

- `AI_PROVIDER=mock` or `AI_PROVIDER=groq`
- `AI_SERVICE_TOKEN`: same token as the API when token protection is enabled
- `GROQ_API_KEY`: set only when `AI_PROVIDER=groq`
- `GROQ_MODEL`
- `GROQ_API_URL`

## Database Migration Strategy

1. Create the production Postgres database.
2. Set `DATABASE_URL` in the API environment.
3. Run Prisma generate/build in CI or the host build step.
4. Run migrations before API start:

```bash
pnpm --filter @openme/api db:generate
pnpm --filter @openme/api db:deploy
```

The repository currently has a `db:migrate` script for local development using
`prisma migrate dev`. For production, use `db:deploy`.

Seed production only when intentionally creating demo data. Do not seed by
default.

## CORS and Cookie Notes

- The API allows credentialed browser requests from `WEB_URL`.
- Production API startup fails if `WEB_URL` is missing or set to wildcard.
- The auth cookie is HTTP-only and has no hardcoded domain.
- Local/dev cookies use `SameSite=Lax` and are not `Secure`, so localhost auth
  keeps working.
- Production cookies are `Secure` and use `SameSite=None` to support common
  free-tier split hosting where web and API live on different domains.
- Some browsers or hosting combinations may still make cross-site cookies
  brittle. If production auth is unreliable, move web and API under same-site
  custom domains before adding more auth features.

## AI Service Options

- Start with `AI_ENABLED=false` to deploy the core product first.
- Use `AI_PROVIDER=mock` to verify API-to-AI integration without Groq.
- Use `AI_PROVIDER=groq` only after setting `GROQ_API_KEY` on the AI service.
- Set the same `AI_SERVICE_TOKEN` on `apps/api` and `apps/ai-service` if the AI
  service is deployed. `/analyze-submission` then requires
  `X-OpenMe-AI-Token`, while `GET /health` remains public.
- Keep Groq secrets away from `apps/web`, Vercel public env vars, and client logs.

## MVP Security Hardening

- API JSON request bodies are limited to `100kb`.
- Auth login/register routes are limited to 10 requests per 15 minutes per IP.
- Public submission creation is limited to 20 requests per 15 minutes per IP.
- General API traffic is limited to 300 requests per 15 minutes per IP.
- `JWT_SECRET` must be set, changed from the placeholder, and at least 32
  characters when `NODE_ENV=production`.
- Rate limiting is in-memory and only protects a single API process. For
  multi-instance or higher-scale production, add provider firewall rules,
  gateway-level throttling, or an external rate limiter later.

## What To Deploy First

1. Production Postgres.
2. API with `AI_ENABLED=false`.
3. Web with `NEXT_PUBLIC_API_URL` pointed at the API.
4. Manual QA for auth, public profile, endpoint submission, and inbox.
5. AI service in mock mode, then Groq mode if needed.

## What Can Be Postponed

- AI service deployment.
- Groq integration.
- Email verification.
- Password reset.
- External or distributed rate limiting.
- Abuse protection beyond validation and MVP in-memory rate limits.
- Background queue or retry system.
- Provider-specific Docker or infrastructure manifests.

## Risks and Limitations of Free Tiers

- Services may sleep, causing slow first requests.
- Database storage, connection, and compute limits are small.
- Cross-site cookie behavior can vary across browsers and provider domains.
- Free services may rotate URLs or require manual restarts.
- In-memory API rate limiting does not coordinate across multiple instances.
- Abuse protection is still basic and should be revisited before a larger launch.
- AI service token protection must be enabled with `AI_SERVICE_TOKEN` if the AI
  service is publicly reachable.
- Fire-and-forget AI analysis can be delayed or missing if the AI service is
  offline.
