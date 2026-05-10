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
- calls to AI service later

### apps/ai-service

Python + FastAPI service.

Responsibilities:

- analyze submissions
- classify intent
- check boundaries
- suggest replies
- moderate content

This app comes after the web and API MVP works.

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
