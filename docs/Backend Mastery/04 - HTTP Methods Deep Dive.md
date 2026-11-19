---
tags:
  - http
  - rest
---

# 04 — HTTP Methods Deep Dive

> [!info] Prerequisites
> [[03 - HTTP Fundamentals]]. Next: [[05 - REST API Principles]].
> "All the methods" is a core interview + design topic. Own it completely.

## The full set

| Method | Purpose | Body | Safe | Idempotent | Cacheable |
|--------|---------|------|------|------------|-----------|
| **GET** | Read | no | ✅ | ✅ | ✅ |
| **HEAD** | GET without body | no | ✅ | ✅ | ✅ |
| **POST** | Create / trigger | yes | ❌ | ❌ | rarely |
| **PUT** | Full replace / upsert | yes | ❌ | ✅ | ❌ |
| **PATCH** | Partial update | yes | ❌ | maybe | ❌ |
| **DELETE** | Remove | optional | ❌ | ✅ | ❌ |
| **OPTIONS** | Ask allowed methods (preflight) | no | ✅ | ✅ | ❌ |
| CONNECT / TRACE | tunnels / echo-probe | — | — | — | — |

> [!important] Definitions
> - **Safe** = no meaningful side-effect (GET, HEAD only).
> - **Idempotent** = 1× and 100× leave the same state (GET, HEAD, PUT, DELETE, OPTIONS). **Not** POST, PATCH.
> - Idempotency matters because networks fail *after* the server acts but *before* the response arrives. Retrying an idempotent request is harmless; retrying POST can duplicate.

## What YOUR server currently exposes

From `server/src/routes/sensor.routes.js`:
```js
router.post('/sensors', apiKeyAuth, sensorController.postSensorData); // POST ✓
router.get('/sensors', sensorController.getLatestSensorData);         // GET ✓
router.get('/health', sensorController.getHealthStatus);              // GET ✓
```
**Only GET and POST.** There is no PUT/PATCH/DELETE anywhere in the project. Your CORS config (`app.js:42`) even hard-blocks them:
```js
methods: ['GET', 'POST', 'OPTIONS'],
```

> [!example] Watch the method layer reject you
> `curl -X DELETE http://localhost:3000/api/sensors` → you'll get a `404` from `notFound.js` (no route matches). Now try it **from a browser** with fetch from another origin — you'd instead get a **CORS preflight failure** because `DELETE` isn't in `methods`. Two different rejection points for the same missing capability.

## Method-by-method, designed properly

### GET — read (your `getLatestSensorData`)
```
GET /api/sensors              → 200 latest reading
GET /api/sensors?status=stale → 200 filtered (query params = filters, never new operations)
GET /api/sensors/:id          → 200 one / 404 unknown
```
Rules: no body, no state change, safe to retry, cacheable.

### POST — create / trigger (your `postSensorData`)
```
POST /api/sensors { ...reading... } → 200 {status:"ok"}   (textbook: 201 + Location)
POST /api/login                     → not a "resource create" but still POST
```
Your ingress is really an **event stream** — POST is right even without CRUD "creation".

> [!question] Predict
> Your controller returns `200` on successful ingestion. The REST textbook says creation should be `201`. Is `200` wrong?
>
> > [!success]- Answer
> > Not *wrong*, but less precise. `201 Created` + a `Location` header (pointing to the new resource) is the convention when a resource is created. Here nothing addressable is created — it's a stream ingest — so `200` is defensible. The lesson: **status codes communicate intent**; choose deliberately, document the choice. If you add a `/devices` create endpoint, use `201`.

### PUT — full replace / upsert (you'd add it)
```
PUT /api/sensors/abc123  {entire representation}  → 200 replaced / 201 created
```
Idempotent: same body twice = same state.

### PATCH — partial (you'd add it)
```
PATCH /api/sensors/abc123  {"note":"calibrated"}  → 200
```

### DELETE — remove (you'd add it)
```
DELETE /api/sensors/abc123 → 200 or 204; then 404 or 204 again
```

### HEAD — GET's headers only
`curl -I http://localhost:3000/api/health` — Express auto-answers HEAD for GET routes. Use it for cheap existence/`Content-Length` checks.

### OPTIONS — the CORS preflight
When a browser sends `x-api-key` (a custom header) cross-origin, it first sends `OPTIONS` asking permission. `cors()` (`app.js:34`) auto-answers using `methods`/`allowedHeaders`. That's why you never wrote OPTIONS code.

## Full CRUD lab (build it by hand — no AI)

Add these to `sensor.routes.js` **one at a time**, testing each with curl *before* writing the next. Use a simple in-memory `notes` object in a new service.

- [ ] `GET /api/notes` → list (200)
- [ ] `GET /api/notes/:id` → one, or `404` via `res.status(404).json({error:'Not found'})`
- [ ] `POST /api/notes` → create, respond `201` + `Location` header (`res.location(...)`)
- [ ] `PUT /api/notes/:id` → replace (idempotent)
- [ ] `PATCH /api/notes/:id` → partial
- [ ] `DELETE /api/notes/:id` → `204 No Content` (`res.status(204).end()`)
- [ ] **Then** add `'PUT','PATCH','DELETE'` to `app.js:42` `methods` and `'Content-Type'` to `allowedHeaders`; re-test from a browser/DevTools to prove the preflight now passes.

Test commands you'll need:
```
curl -X GET    localhost:3000/api/notes
curl -X POST   localhost:3000/api/notes -H "Content-Type: application/json" -d '{"text":"a"}'
curl -X PUT    localhost:3000/api/notes/1 -H "Content-Type: application/json" -d '{"text":"b"}'
curl -X PATCH  localhost:3000/api/notes/1 -H "Content-Type: application/json" -d '{"text":"c"}'
curl -i -X DELETE localhost:3000/api/notes/1
curl -I        localhost:3000/api/notes
curl -X OPTIONS localhost:3000/api/notes -i
```

> [!bug] Debug challenge — find 3 bugs
> ```js
> router.get('/api/deleteSensor', (req, res) => {
>   delete store[req.query.id];
>   res.json({ deleted: true });
> });
> router.post('/sensor', (req, res) => {   // create
>   store.push(req.body);
>   res.status(200).json({ ok: true });     // created
> });
> ```
> 1. Deleting via GET (violates safe/idempotent).
> 2. `/api` prefix duplicated — the router is already mounted at `/api`, so this path becomes `/api/api/deleteSensor`.
> 3. Creation should be `201`, and the path is singular/inconsistent `/sensor` vs `/sensors`.
> Explain each in one sentence.

> [!warning] Top 3 beginner method mistakes
> 1. `GET` that mutates state — cacheable, prefetchable, unsafe.
> 2. POST for everything — loses caching/idempotency/clarity.
> 3. Two operations distinguished only by body on the same method+path — routers and caches only see method+path.

## Resources
- Playlist: [Backend from first principles](https://youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1)
- [RFC 9110 §9 — Method Semantics](https://www.rfc-editor.org/rfc/rfc9110.html#section-9)
- [MDN: HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)

Next: [[05 - REST API Principles]]
