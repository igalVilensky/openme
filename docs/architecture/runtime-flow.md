# Runtime Flow

This document describes the current MVP runtime path for public submissions and AI analysis.

## Public Submission Flow

```text
apps/web -> apps/api -> PostgreSQL -> apps/ai-service -> Groq/mock -> PostgreSQL -> inbox
```

Step by step:

1. A visitor opens a public endpoint page in `apps/web`, such as `/demo/collaborate`.
2. `apps/web` fetches endpoint configuration from `apps/api`.
3. The visitor submits the form.
4. `apps/web` posts the submission to `apps/api`.
5. `apps/api` validates the payload against the endpoint fields.
6. `apps/api` writes a `Submission` row to PostgreSQL.
7. If `AI_ENABLED=true`, `apps/api` sends analysis input to `apps/ai-service`.
8. `apps/ai-service` analyzes with the configured provider.
9. `apps/api` stores the result in `SubmissionAnalysis`.
10. An authenticated owner dashboard reads submissions and analysis from PostgreSQL.

## Auth Flow

```text
apps/web -> apps/api -> PostgreSQL -> HTTP-only auth cookie
```

Step by step:

1. A user registers at `/register` with email, password, username, and display name.
2. `apps/api` validates the email, password length, and username format.
3. `apps/api` hashes the password with bcrypt before storing it on `User`.
4. `apps/api` creates a public `Profile` for the user.
5. `apps/api` signs a JWT with `JWT_SECRET` and sets it in an HTTP-only cookie.
6. A returning user logs in at `/login` with email and password.
7. `apps/api` verifies the password hash and refreshes the auth cookie.
8. `/auth/me` reads the cookie and returns the current user/profile summary.

The auth cookie is `httpOnly`, `sameSite=lax`, `path=/`, and `secure` only in production. `JWT_SECRET` is server-only and must never be exposed to `apps/web`.

## Dashboard Inbox Flow

```text
apps/web -> apps/api auth middleware -> PostgreSQL
```

Step by step:

1. Dashboard pages call `/dashboard/inbox`, `/dashboard/inbox/:submissionId`, and `/dashboard/inbox/:submissionId/status` with credentials included.
2. `apps/api` verifies the HTTP-only auth cookie.
3. Auth middleware attaches the current user/profile to the request.
4. Inbox queries filter submissions through the authenticated profile id.
5. If the owner is not logged in, the API returns HTTP 401 and the web UI shows a login prompt.

Legacy demo-only inbox routes remain temporarily available under `/dashboard/demo/inbox` for local compatibility. The dashboard UI uses the authenticated owner routes.

## When AI_ENABLED=false

When `AI_ENABLED=false`, `apps/api` does not call `apps/ai-service`.

The submission flow is:

```text
apps/web -> apps/api -> PostgreSQL -> authenticated inbox
```

The submission is stored and appears in the inbox without analysis.

## When AI Service Fails

Submission creation is the primary user action. AI analysis is secondary.

If the AI service is offline, returns an error, times out, or returns invalid data:

- `apps/api` logs the failure.
- `apps/api` does not roll back the submission.
- The public form still returns success.
- The inbox still shows the submission.
- `SubmissionAnalysis` may be missing for that submission.

AI analysis is currently fire-and-forget, so even successful analysis can briefly be pending.

## Provider Behavior

`apps/ai-service` supports two providers:

- `mock`: deterministic local analysis, default mode, no paid API calls
- `groq`: Groq chat completions API, enabled only when `AI_PROVIDER=groq` and `GROQ_API_KEY` is configured

If Groq mode is configured but Groq fails or returns invalid output, `apps/ai-service` falls back to mock analysis.

## What Is Stored in Submission

`Submission` stores the visitor-submitted record:

- `id`
- `endpointId`
- `status`
- `submitterName`
- `submitterEmail`
- `data`
- `message`
- `createdAt`
- `updatedAt`

`data` contains answers keyed by endpoint field ID.

## What Is Stored in SubmissionAnalysis

`SubmissionAnalysis` stores the structured analysis for one submission:

- `id`
- `submissionId`
- `summary`
- `intent`
- `boundaryStatus`
- `priority`
- `suggestedReply`
- `raw`
- `createdAt`
- `updatedAt`

Allowed `boundaryStatus` values:

```text
FITS
UNCLEAR
VIOLATES
NEEDS_REVIEW
```

Allowed `priority` values:

```text
LOW
MEDIUM
HIGH
URGENT
```

The `raw` field currently stores the returned structured analysis payload for debugging and future audit use.

## Service Boundaries

- `apps/web` calls `apps/api`.
- `apps/web` never calls `apps/ai-service`.
- `apps/web` never sees `GROQ_API_KEY`.
- `apps/web` never sees `JWT_SECRET`.
- `apps/api` calls `apps/ai-service`.
- `apps/api` never calls Groq directly.
- `apps/ai-service` is the only service that can call Groq.
- `apps/api` owns password hashing, JWT signing, auth cookies, and owner-scoped dashboard access.
