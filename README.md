# comment0r v1

Embeddable blog comment system with TypeScript microservices, CouchDB, and Traefik routing.

## Services

- `comments-api`: REST endpoints for listing/creating comments, thread summaries, and soft-delete.
- `comments-stream`: SSE endpoint for realtime comment updates.
- `static-web`: Nginx container serving `/demo`, `/manage`, and widget/admin bundles.
- `traefik`: reverse proxy in front of all services.
- `couchdb`: persistent datastore.

## Local run

```bash
docker compose -f infra/docker-compose.yml up --build
```

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
- `GET /api/threads/:threadId/comments?limit=50&cursor=...`
- `POST /api/threads/:threadId/comments` with body `{ "body": "...", "authorName": "optional" }`
- `DELETE /api/threads/:threadId/comments/:commentId` (soft-delete)
- `POST /api/threads/:threadId/comments/:commentId/restore` (undo soft-delete)
- `GET /events/threads/:threadId/events` (SSE)

## v1 limitations

- Anonymous posting only.
- No anti-spam controls.
- Top-level comments only.
- Removal is soft-delete only (managed via `/manage`).
