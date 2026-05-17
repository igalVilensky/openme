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

## Homepage Checks

- Open the root homepage in the browser.

```text
http://localhost:3000/
```

Expected: the page explains OpenMe as an MVP public interaction menu and shows working CTAs for `/demo`, `/login`, and `/register`.

## Auth Checks

- Confirm unauthenticated dashboard access is rejected.

```bash
curl -i http://localhost:4000/auth/me
curl -i http://localhost:4000/dashboard/profile
curl -i http://localhost:4000/dashboard/links
curl -i http://localhost:4000/dashboard/endpoints
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

## Profile Editor Checks

- Log back in as the local-only demo user if the auth checks cleared the cookie.

```bash
curl -i -c /tmp/openme-cookies.txt \
  -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@openme.local","password":"password123"}'
```

- Fetch the authenticated owner profile with the demo login cookie.

```bash
curl -b /tmp/openme-cookies.txt http://localhost:4000/dashboard/profile
```

Expected: profile username is `demo` and public profile fields are present.

- Update editable profile fields.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X PATCH http://localhost:4000/dashboard/profile \
  -H "Content-Type: application/json" \
  -d '{"headline":"Full-stack developer building useful AI-assisted tools","bio":"Short demo bio for QA.","status":"Open to meaningful collaborations","languages":["English","German","Hebrew"],"currentFocus":"Building OpenMe","isPublic":true}'
```

Expected: HTTP 200 and the response includes the updated fields.

- Confirm username editing is rejected.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X PATCH http://localhost:4000/dashboard/profile \
  -H "Content-Type: application/json" \
  -d '{"username":"new-demo"}'
```

Expected: HTTP 400 validation error.

- Open the profile editor in the browser.

```text
http://localhost:3000/dashboard/profile
```

- If prompted, log in with `demo@openme.local` / `password123`.

- Edit headline, bio, status, current focus, and languages, then save.

Expected: a save success message appears with a link to the public profile.

- Open the public demo profile.

```text
http://localhost:3000/demo
```

Expected: saved profile fields are visible. Username, endpoints, and avatar uploads are not editable yet.

## Link Editor Checks

- Fetch the authenticated owner links with the demo login cookie.

```bash
curl -b /tmp/openme-cookies.txt http://localhost:4000/dashboard/links
```

Expected: the seeded demo links are returned ordered by `position`.

- Create a new visible link.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X POST http://localhost:4000/dashboard/links \
  -H "Content-Type: application/json" \
  -d '{"title":"QA Link","url":"https://example.com/qa","isVisible":true}'
```

Expected: HTTP 201 and the response includes `position`, `isVisible`, `createdAt`, and `updatedAt`.

- Confirm invalid links are rejected.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X POST http://localhost:4000/dashboard/links \
  -H "Content-Type: application/json" \
  -d '{"title":"","url":"ftp://example.com"}'
```

Expected: HTTP 400 validation error.

- Pick the created link ID and edit it.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X PATCH http://localhost:4000/dashboard/links/LINK_ID \
  -H "Content-Type: application/json" \
  -d '{"title":"QA Link Updated","url":"https://example.com/qa-updated"}'
```

Expected: HTTP 200 and the updated title and URL are returned.

- Hide the link.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X PATCH http://localhost:4000/dashboard/links/LINK_ID \
  -H "Content-Type: application/json" \
  -d '{"isVisible":false}'
```

- Fetch the public demo profile.

```bash
curl http://localhost:4000/public/profiles/demo
```

Expected: the hidden link is not included in `links`.

- Show the link again.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X PATCH http://localhost:4000/dashboard/links/LINK_ID \
  -H "Content-Type: application/json" \
  -d '{"isVisible":true}'
```

Expected: the link appears again in the public profile response.

- Reorder links by sending all current link IDs in the desired order.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X PATCH http://localhost:4000/dashboard/links/reorder \
  -H "Content-Type: application/json" \
  -d '{"orderedIds":["LINK_ID_1","LINK_ID_2","LINK_ID_3"]}'
```

Expected: HTTP 200 and returned links have positions matching the array order.

- Confirm incomplete reorder payloads are rejected.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X PATCH http://localhost:4000/dashboard/links/reorder \
  -H "Content-Type: application/json" \
  -d '{"orderedIds":["LINK_ID_1"]}'
```

Expected: HTTP 400 validation error.

- Delete the created link.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X DELETE http://localhost:4000/dashboard/links/LINK_ID
```

Expected: HTTP 200 with `{"success":true}` and the link no longer appears on `/demo`.

- Open the link editor in the browser.

```text
http://localhost:3000/dashboard/links
```

- If prompted, log in with `demo@openme.local` / `password123`.

- Add a link, edit it, hide it, show it, move it with Up/Down buttons, and delete it.

Expected: success or saving states appear for each action, and `http://localhost:3000/demo` reflects visible links and their order.

## Endpoint Builder Checks

- Fetch the authenticated owner endpoints with the demo login cookie.

```bash
curl -b /tmp/openme-cookies.txt http://localhost:4000/dashboard/endpoints
```

Expected: seeded demo endpoints are returned ordered by `position`, with field, boundary, and submission counts.

- Create a published public POST endpoint.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X POST http://localhost:4000/dashboard/endpoints \
  -H "Content-Type: application/json" \
  -d '{"slug":"test-idea","method":"POST","title":"Test idea","description":"Send me an idea","visibility":"PUBLIC","status":"PUBLISHED"}'
```

Expected: HTTP 201 and the response includes `position`, counts, `createdAt`, and `updatedAt`.

- Open the created endpoint detail.

```bash
curl -b /tmp/openme-cookies.txt http://localhost:4000/dashboard/endpoints/ENDPOINT_ID
```

Expected: metadata, `submissionCount`, fields, boundaries, `createdAt`, and `updatedAt` are returned.

- Add a required long-text field.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X POST http://localhost:4000/dashboard/endpoints/ENDPOINT_ID/fields \
  -H "Content-Type: application/json" \
  -d '{"type":"LONG_TEXT","label":"What is your idea?","helpText":null,"placeholder":"Describe it...","options":null,"required":true}'
```

Expected: HTTP 201 and the response includes the field at position `0`.

- Add an active boundary.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X POST http://localhost:4000/dashboard/endpoints/ENDPOINT_ID/boundaries \
  -H "Content-Type: application/json" \
  -d '{"title":"Specific and respectful","description":"Send a clear idea, not spam.","priority":"MEDIUM","isActive":true}'
```

Expected: HTTP 201 and the boundary is returned.

- Confirm the endpoint appears publicly.

```bash
curl http://localhost:4000/public/profiles/demo
curl http://localhost:4000/public/profiles/demo/endpoints/test-idea
```

Expected: `/test-idea` appears in the public profile endpoint list and its field/boundary are returned by the public endpoint API.

- Submit to the new endpoint.

```bash
curl -i \
  -X POST http://localhost:4000/public/profiles/demo/endpoints/test-idea/submissions \
  -H "Content-Type: application/json" \
  -d '{"submitterName":"QA Visitor","submitterEmail":"qa-visitor@example.com","data":{"FIELD_ID":"A focused test idea."},"message":"Optional note."}'
```

Expected: HTTP 201 and a `Submission received` response.

- Confirm submitted endpoints cannot be deleted directly.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X DELETE http://localhost:4000/dashboard/endpoints/ENDPOINT_ID
```

Expected: HTTP 409 with `Endpoint has submissions. Archive it instead.`

- Edit endpoint metadata.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X PATCH http://localhost:4000/dashboard/endpoints/ENDPOINT_ID \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated test idea"}'
```

Expected: HTTP 200 and the public endpoint page reflects the updated title.

- Reorder endpoints by sending all current endpoint IDs in the desired order.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X PATCH http://localhost:4000/dashboard/endpoints/reorder \
  -H "Content-Type: application/json" \
  -d '{"orderedIds":["ENDPOINT_ID_1","ENDPOINT_ID_2"]}'
```

Expected: HTTP 200 and returned endpoint positions match the array order.

- Reorder fields by sending all field IDs for the endpoint.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X PATCH http://localhost:4000/dashboard/endpoints/ENDPOINT_ID/fields/reorder \
  -H "Content-Type: application/json" \
  -d '{"orderedIds":["FIELD_ID_1","FIELD_ID_2"]}'
```

Expected: HTTP 200 when all field IDs for the endpoint are included, or HTTP 400 when the set is incomplete.

- Archive the endpoint.

```bash
curl -i \
  -b /tmp/openme-cookies.txt \
  -X PATCH http://localhost:4000/dashboard/endpoints/ENDPOINT_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"ARCHIVED"}'
```

Expected: the endpoint no longer appears on `/demo`, and `/demo/test-idea` returns not found.

- Open the endpoint builder in the browser.

```text
http://localhost:3000/dashboard/endpoints
```

- If prompted, log in with `demo@openme.local` / `password123`.

- Create `test-idea`, open its detail editor, add the long-text field and boundary above, publish it, submit from `/demo/test-idea`, then archive it.

Expected: the dashboard shows loading, saving, success, helper copy, and error states. Endpoints with submissions show archive-focused safety copy instead of delete. Reordering uses Up/Down buttons; no drag-and-drop or conditional fields are present.

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
visible links only
published public endpoints including collaborate, ask-me, and feedback
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

## Pre-Deployment QA Checklist

- Build the API.

```bash
pnpm --filter @openme/api build
```

- Build the web app.

```bash
pnpm --filter @openme/web build
```

- Test local auth with the demo login.
- Test the public profile at `/demo`.
- Test public endpoint submission at `/demo/collaborate`.
- Test the dashboard inbox at `/dashboard/inbox`.
- Confirm `.env` is not committed and no real secrets are staged.

### AI_ENABLED=false Test

- Start the API with AI disabled.

```bash
AI_ENABLED=false pnpm --filter @openme/api dev
```

- Submit a public endpoint form.

Expected: submission creation succeeds, the submission appears in the inbox, and
the inbox detail shows no analysis or a pending/unavailable analysis state.

### Production-Like Auth and Cookie Sanity Test

- With the API running locally in development mode, send a credentialed login
  request with the local frontend origin.

```bash
curl -i -c /tmp/openme-cookies.txt \
  -H "Origin: http://localhost:3000" \
  -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@openme.local","password":"password123"}'
```

Expected:

```text
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Set-Cookie: openme_auth=...; Path=/; HttpOnly; SameSite=Lax
```

The local development cookie should not include `Secure`.

- Before production deploy, confirm the deployed API is configured with
  `NODE_ENV=production` and `WEB_URL` set to the deployed frontend URL.

Expected: production auth cookies are HTTP-only, `Secure`, have no hardcoded
`Domain`, and are accepted by the browser when the frontend calls the API with
credentials.

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
/demo/collaborate -> submit form -> /login -> /dashboard/profile -> save profile -> /dashboard/links -> manage links -> /dashboard/endpoints -> manage endpoint -> /dashboard/inbox -> open detail
```

- Confirm logged-out dashboard pages show a login prompt or redirect path.

- Confirm public submission creation still succeeds when AI service is stopped.

- Confirm inbox detail naturally shows analysis when it exists, or a pending message with a refresh action when analysis is not available yet.
