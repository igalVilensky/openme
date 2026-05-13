# Build Order

## Step 1: apps/api

Create the Express TypeScript API app.

Requirements:

- runs on port 4000
- has /health route
- uses dotenv
- uses cors
- uses express.json
- has centralized error middleware
- has modular folder structure
- uses Prisma later
- no database logic required in the first commit except setup placeholders

## Step 2: Database schema

Add Prisma and PostgreSQL schema for:

- User
- Profile
- Link
- Endpoint
- EndpointField
- EndpointBoundary
- Submission
- SubmissionAnalysis

## Step 3: apps/web

Create the Next.js TypeScript app.

Requirements:

- runs on port 3000
- has landing page
- has placeholder public profile route at /[username]
- has placeholder public endpoint route at /[username]/[endpointSlug]
- has dashboard placeholder
- has API client pointing to API_URL

## Step 4: Public profile page

Implement public profile fetching from API for routes such as /igal and /demo.

## Step 5: Endpoint submission flow

Implement public endpoint form and submission creation for routes such as /igal/collaborate and /demo/collaborate.

## Step 6: Inbox

Implement owner inbox.

## Step 7: AI service

Create FastAPI app with /health and /analyze-submission.
