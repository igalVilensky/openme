# OpenMe Architecture

OpenMe uses a monorepo.

## Apps

### apps/web

Next.js app.

Responsibilities:

- landing page
- public profile pages
- public endpoint forms
- dashboard
- endpoint builder
- inbox UI

### apps/api

Node.js + Express + TypeScript API.

Responsibilities:

- authentication
- profiles
- links
- endpoints
- submissions
- inbox
- public profile API
- calls apps/ai-service after public submission creation when AI_ENABLED=true

### apps/ai-service

Python + FastAPI service.

Responsibilities:

- analyze submissions
- classify intent
- check boundaries
- suggest replies
- moderate content

Providers:

- mock analyzer by default
- Groq analyzer when AI_PROVIDER=groq and GROQ_API_KEY is configured

apps/web never calls Groq. apps/api never calls Groq directly. apps/api calls
apps/ai-service, and apps/ai-service is the only app that can call Groq.

## Database

PostgreSQL with Prisma.

Main entities:

- users
- profiles
- links
- endpoints
- endpoint_fields
- endpoint_boundaries
- submissions
- submission_analysis

## Important principles

- Keep MVP simple.
- Do not add micro-frontends yet.
- Do not add Nuxt yet.
- Do not add Firebase yet.
- Do not add queues yet.
- AI must be optional.
- If AI fails, submissions must still be saved.
- Failed AI analysis must never block public submission creation.
