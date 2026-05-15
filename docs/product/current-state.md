# Current State

This document captures the state of the OpenMe MVP after the first working public submission and AI analysis flow.

## Completed Features

- Root monorepo setup with pnpm workspaces and Turbo
- `apps/api` Express + TypeScript service
- Prisma/PostgreSQL schema for users, profiles, links, endpoints, fields, boundaries, submissions, and submission analysis
- Seed script for the demo profile
- `apps/web` Next.js app
- Public demo profile page at `/demo`
- Public endpoint page and submission form at `/demo/collaborate`
- Public submission creation through `apps/api`
- Dashboard inbox list at `/dashboard/inbox`
- Dashboard submission detail page
- Submission status updates
- `apps/ai-service` FastAPI service
- Mock AI analysis provider
- Groq AI analysis provider
- API-to-AI-service integration when `AI_ENABLED=true`
- AI analysis display in inbox detail when analysis exists

## Current User Flow

1. A visitor opens `http://localhost:3000/demo`.
2. The visitor chooses a public endpoint such as `Collaborate`.
3. The visitor submits the public endpoint form.
4. `apps/web` sends the submission to `apps/api`.
5. `apps/api` validates and stores the submission in PostgreSQL.
6. If `AI_ENABLED=true`, `apps/api` calls `apps/ai-service`.
7. `apps/ai-service` analyzes the submission using mock mode or Groq mode.
8. `apps/api` stores the result in `SubmissionAnalysis`.
9. The owner opens `/dashboard/inbox`.
10. The owner opens a submission detail page and sees the analysis if it has completed.

## Current Architecture Status

- `apps/web` owns public pages and dashboard UI.
- `apps/api` owns validation, persistence, public profile APIs, public submission APIs, and inbox APIs.
- `apps/ai-service` owns analysis and is the only app that can call Groq.
- PostgreSQL is the system of record.
- Prisma defines the relational schema and generated API client types.
- AI is optional and controlled by `AI_ENABLED`.
- Mock AI mode is available by default.
- Groq mode is available when `AI_PROVIDER=groq` and `GROQ_API_KEY` is configured.

## Temporary MVP Shortcuts

- No auth yet.
- Dashboard inbox is scoped to the seeded demo profile.
- No real user profile builder yet.
- No endpoint builder yet.
- No production deployment config yet.
- AI service is not protected by auth or a service token yet.
- AI analysis is fire-and-forget, so analysis can briefly be pending.

## Known Limitations

- Only the seeded demo owner flow is wired end to end.
- Dashboard routes assume the demo profile.
- Public endpoint fields and boundaries are seeded, not user-managed.
- There are no automated end-to-end tests yet.
- AI analysis has no retry queue.
- AI analysis can be delayed or absent if the AI service is offline.
- Groq responses are validated and fall back to mock, but there is no provider observability beyond server logs.
- No rate limiting or abuse protection yet.
- No production secrets management yet.
- No production deployment manifests for web, API, AI service, or database.

## Next Recommended Steps

- Add authentication and owner-scoped dashboard access.
- Build profile editing and endpoint builder flows.
- Add a service token or private network boundary for `apps/ai-service`.
- Add automated tests for public submission creation, inbox reads, and AI fallback behavior.
- Add explicit pending/complete analysis state in the inbox UI.
- Add production deployment configuration.
- Add rate limiting for public submission endpoints.
- Add structured logging for API and AI service failures.
- Add background job or retry infrastructure if AI analysis becomes more important.
