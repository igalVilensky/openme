# Deployment Checklist

Use this checklist before deploying OpenMe to free-tier services.

## Before Deployment

- [ ] Run `pnpm install`.
- [ ] Build API: `pnpm --filter @openme/api build`.
- [ ] Build web: `pnpm --filter @openme/web build`.
- [ ] Test local auth.
- [ ] Test the public profile.
- [ ] Test endpoint submission.
- [ ] Test the dashboard inbox.
- [ ] Test `AI_ENABLED=false` mode.
- [ ] Test `AI_ENABLED=true` mode if deploying the AI service.
- [ ] Test large JSON body rejection.
- [ ] Test repeated login attempts eventually return HTTP 429.

## Database

- [ ] Create production Postgres.
- [ ] Set `DATABASE_URL` on the API service.
- [ ] Run migrations against production.
- [ ] Seed only if intentionally creating demo data.

## Secrets

- [ ] Set `JWT_SECRET` to a long random production secret on the API service.
- [ ] Confirm `JWT_SECRET` is not the placeholder and is at least 32 characters.
- [ ] Set `AI_SERVICE_TOKEN` on API and AI service if deploying AI service.
- [ ] Set `GROQ_API_KEY` only on the AI service.
- [ ] Confirm `.env` is not committed.
- [ ] Confirm production secrets are not present in frontend public env vars.
- [ ] Confirm `AI_SERVICE_TOKEN`, `JWT_SECRET`, and `GROQ_API_KEY` are not
  exposed to `apps/web`.

## Frontend

- [ ] Set `NEXT_PUBLIC_API_URL` to the production API URL.
- [ ] Confirm `NEXT_PUBLIC_API_URL` starts with `https://`.
- [ ] Confirm Vercel Output Directory is `.next` when Root Directory is
  `apps/web`.
- [ ] Build and deploy `apps/web`.
- [ ] Test `/`.
- [ ] Test `/login`.
- [ ] Test `/demo`.

## API

- [ ] Set `WEB_URL` to the production frontend URL.
- [ ] Set `DATABASE_URL`.
- [ ] Set `JWT_SECRET`.
- [ ] Set `AI_ENABLED`.
- [ ] Set `AI_SERVICE_URL` if AI is enabled.
- [ ] Set `AI_SERVICE_TOKEN` if AI service token protection is enabled.
- [ ] Confirm the Render build command does not include `corepack enable`.
- [ ] Confirm the Render install command uses `--prod=false`.
- [ ] Confirm Render `WEB_URL` exactly matches the deployed Vercel production
  URL.
- [ ] Test `GET /health`.
- [ ] Confirm the API `/health` route works.
- [ ] Confirm auth route rate limiting returns HTTP 429 after repeated attempts.

## AI Service

- [ ] Set `AI_PROVIDER=mock` or `AI_PROVIDER=groq`.
- [ ] Set `AI_SERVICE_TOKEN` if the AI service is publicly reachable.
- [ ] Set `GROQ_API_KEY` only if using `AI_PROVIDER=groq`.
- [ ] Test `GET /health`.
- [ ] If `AI_SERVICE_TOKEN` is set, confirm `/analyze-submission` returns HTTP
  401 without `X-OpenMe-AI-Token`.
- [ ] Confirm API-to-AI analysis succeeds when the API has the matching token.

## Production Smoke Test

- [ ] Register or log in.
- [ ] Confirm registration works after Render `WEB_URL` is updated.
- [ ] Confirm the auth cookie is set and dashboard requests include it.
- [ ] Open the public profile.
- [ ] Submit a public endpoint form.
- [ ] Open the inbox and confirm the submission appears.
- [ ] Confirm AI analysis is absent but non-blocking when `AI_ENABLED=false`.
- [ ] Confirm AI analysis appears when `AI_ENABLED=true` and the AI service is
  deployed.
- [ ] Confirm public submission rate limiting eventually returns HTTP 429 after
  repeated submissions from the same IP.
