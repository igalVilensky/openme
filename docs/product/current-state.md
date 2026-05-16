# Current State

This document captures the state of the OpenMe MVP after adding the authenticated dashboard endpoint builder.

## Completed Features

- Root monorepo setup with pnpm workspaces and Turbo
- `apps/api` Express + TypeScript service
- Prisma/PostgreSQL schema for users, profiles, links, endpoints, fields, boundaries, submissions, and submission analysis
- Seed script for the demo profile
- `apps/web` Next.js app
- Public demo profile page at `/demo`
- Public endpoint page and submission form at `/demo/collaborate`
- Public submission creation through `apps/api`
- Email/password registration and login
- HTTP-only cookie auth with JWT sessions
- Authenticated profile editor at `/dashboard/profile`
- Authenticated dashboard link editor at `/dashboard/links`
- Owner-scoped link create, edit, delete, visible/hidden toggle, and Up/Down reordering
- Authenticated dashboard endpoint builder at `/dashboard/endpoints`
- Owner-scoped endpoint metadata, field, boundary, publish/archive, delete, and Up/Down reorder flows
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
9. The owner logs in at `/login`.
10. The owner can edit public profile fields at `/dashboard/profile`.
11. The public profile page reflects saved profile changes.
12. The owner can manage public profile links at `/dashboard/links`.
13. The public profile page reflects visible links and their saved order.
14. The owner can manage interaction endpoints at `/dashboard/endpoints`.
15. The public profile page reflects published public endpoints and their saved order.
16. Visitors can submit newly created public POST endpoints.
17. The owner opens `/dashboard/inbox`.
18. `apps/api` scopes the inbox to the authenticated owner's profile.
19. The owner opens a submission detail page and sees the analysis if it has completed.

## Current Architecture Status

- `apps/web` owns public pages and dashboard UI.
- `apps/api` owns auth, validation, persistence, owner profile APIs, owner link and endpoint APIs, public profile APIs, public submission APIs, and owner-scoped inbox APIs.
- `apps/ai-service` owns analysis and is the only app that can call Groq.
- PostgreSQL is the system of record.
- Prisma defines the relational schema and generated API client types.
- AI is optional and controlled by `AI_ENABLED`.
- Mock AI mode is available by default.
- Groq mode is available when `AI_PROVIDER=groq` and `GROQ_API_KEY` is configured.

## Temporary MVP Shortcuts

- Auth is MVP email/password only. OAuth, reset flows, and email verification are not implemented.
- Profile editing covers core public profile fields only.
- Link and endpoint reordering use Up/Down buttons. Drag-and-drop is not implemented yet.
- Endpoint fields are simple flat fields. Conditional field logic is not implemented yet.
- Username editing and avatar uploads are not implemented yet.
- Legacy demo inbox routes remain available at `/dashboard/demo/inbox` for local compatibility.
- No production deployment config yet.
- AI service is not protected by auth or a service token yet.
- AI analysis is fire-and-forget, so analysis can briefly be pending.

## Known Limitations

- The seeded demo user is still the main local end-to-end example.
- The demo user is local-only test data: `demo@openme.local` / `password123`.
- Public endpoint fields and boundaries can be owner-managed, but there is no advanced field logic yet.
- New accounts can log in and edit public profile fields, profile links, and endpoints.
- There are no automated end-to-end tests yet.
- AI analysis has no retry queue.
- AI analysis can be delayed or absent if the AI service is offline.
- Groq responses are validated and fall back to mock, but there is no provider observability beyond server logs.
- No rate limiting or abuse protection yet.
- No production secrets management yet.
- No production deployment manifests for web, API, AI service, or database.

## Next Recommended Steps

- Add conditional field logic only if the core endpoint builder needs it.
- Add username editing after deciding handle-change rules and redirects.
- Add OAuth, password reset, and email verification when the MVP auth path is stable enough to justify them.
- Add a service token or private network boundary for `apps/ai-service`.
- Add automated tests for public submission creation, inbox reads, and AI fallback behavior.
- Add explicit pending/complete analysis state in the inbox UI.
- Add production deployment configuration.
- Add rate limiting for public submission endpoints.
- Add structured logging for API and AI service failures.
- Add background job or retry infrastructure if AI analysis becomes more important.
