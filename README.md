# comment0r v1

Embeddable blog comment system with TypeScript microservices, CouchDB, and Traefik routing.

## Services

- `comments-api`: REST endpoints for listing/creating comments, thread summaries, and soft-delete.
- `comments-stream`: SSE endpoint for realtime comment updates.
- `static-web`: Nginx container serving `/demo`, `/manage`, and widget/admin bundles.
- `auth-mock`: development auth service used by Traefik forward-auth middleware.
- `oauth2-proxy` (optional, `oidc` profile): provider-hosted OIDC authentication.
- `traefik`: reverse proxy in front of all services.
- `couchdb`: persistent datastore.

## Local run

```bash
docker compose -f infra/docker-compose.yml up --build
```

This starts **dev auth mode** by default (`infra/traefik/dynamic.dev.yml`).

### Dev login shortcuts

- Login as regular user for posting:
  - `http://localhost/auth/login?user=dev-user&role=user&rd=/demo/`
- Login as admin for management actions:
  - `http://localhost/auth/login?user=dev-admin&role=admin&rd=/manage/`
- Logout:
  - `http://localhost/auth/logout?rd=/`

### OIDC mode (Google/Apple/Microsoft via provider)

1. Copy `infra/.env.example` values into your environment (or an `.env` file).
2. Switch Traefik dynamic config:

```bash
TRAEFIK_DYNAMIC_FILE=./traefik/dynamic.oidc.yml docker compose -f infra/docker-compose.yml --profile oidc up --build
```

In OIDC mode, oauth2-proxy handles provider-hosted login.

Then open:

- `http://localhost/demo` for the test page
- `http://localhost/manage` for the management UI
- `http://localhost:8080` for the Traefik dashboard

## Widget usage

```html
<div id="comments"></div>
<script src="/assets/comment0r.bundle.js"></script>
<script>
  window.Comment0r.init({
    apiBaseUrl: window.location.origin,
    threadId: "my-article-42",
    container: "#comments"
  });
</script>
```

## API

- `GET /api/threads`
- `GET /api/threads/:threadId/comments?limit=50&cursor=...&includeDeleted=true|false`
- `POST /api/threads/:threadId/comments` with body `{ "body": "...", "authorName": "optional" }`
- `DELETE /api/threads/:threadId/comments/:commentId` (soft-delete)
- `POST /api/threads/:threadId/comments/:commentId/restore` (undo soft-delete)
- `GET /events/threads/:threadId/events` (SSE)

## Auth policy

- Public read routes:
  - `GET /api/threads`
  - `GET /api/threads/:threadId/comments`
  - `GET /events/threads/:threadId/events`
  - `/demo`, `/assets`
- Authenticated route:
  - `POST /api/threads/:threadId/comments`
- Admin routes:
  - `/manage`
  - `DELETE /api/threads/:threadId/comments/:commentId`
  - `POST /api/threads/:threadId/comments/:commentId/restore`

## v1 limitations

- No anti-spam controls.
- Top-level comments only.
- Removal is soft-delete only (managed via `/manage`).
