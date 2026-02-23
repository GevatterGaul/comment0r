# AGENTS.md

This file captures implementation conventions for autonomous coding agents working on `comment0r`.

## Project context

- Goal: embeddable blog comment system.
- Frontend: TypeScript bundles consumed via `<script>`:
  - `comment0r` widget for public pages
  - `comment0r-admin` management UI
- Backend: TypeScript microservices behind Traefik.
- Database: CouchDB.
- Current scope: v1 MVP for local/dev usage.

## Current architecture

- `services/comments-api`: REST create/list comments, thread summaries, soft-delete.
- `services/comments-stream`: SSE realtime events.
- `packages/widget`: embeddable public comment UI bundle.
- `packages/management-ui`: embeddable management UI bundle.
- `packages/shared-types`: shared backend data model types.
- `static-web` (Nginx): serves `/demo`, `/manage`, and `/assets/*` bundles.
- `traefik`: reverse proxy and routing.
- `couchdb`: persistence.

## Ground rules for agents

- Prefer minimal, incremental changes over broad rewrites.
- Keep comments top-level only (no replies) unless explicitly requested.
- Preserve anonymous posting model and immediate visibility.
- Public widget does not expose edit/delete actions.
- Management actions use soft-delete (`deletedAt`) rather than hard delete.
- Do not add anti-spam, auth, or advanced moderation flows unless requested.
- Keep newest-first ordering as default.
- Treat both `/demo` and `/manage` as required smoke-test entrypoints.

## Code and tooling conventions

- TypeScript strict mode should stay enabled.
- Use Fastify for HTTP services unless asked to change framework.
- Validate input at API boundaries.
- Keep shared DB document types in `packages/shared-types` and reuse from services.
- Keep widget rendering XSS-safe (escape user content before injecting HTML).
- Keep management UI rendering XSS-safe as well.
- Keep Traefik as edge router and Nginx static container for demo/manage/assets.

## Verification checklist

Before finalizing major changes, run:

1. `npm run test`
2. `npm run build`
3. `docker compose -f infra/docker-compose.yml config`
4. `docker compose -f infra/docker-compose.yml build`
5. `docker compose -f infra/docker-compose.yml up -d`
6. Smoke check:
   - `GET /demo/` loads and widget works
   - `GET /manage/` loads and thread selector populates
   - comment create/list works
   - management soft-delete hides removed comment from list
   - SSE emits `comment.created` for non-deleted comments
7. `docker compose -f infra/docker-compose.yml down`

## Documentation expectations

- Update `README.md` when routes, startup, or behavior changes.
- Document intentional limitations rather than silently expanding scope.
