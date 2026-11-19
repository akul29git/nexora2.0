---
tags:
  - api
  - fundamentals
---

# 02 — What Is an API?

> [!info] Prerequisites
> [[01 - Backend The Big Picture]]. Next: [[03 - HTTP Fundamentals]].

## Definition (own this wording)

> [!abstract] API — Application Programming Interface
> A **contract** defining *how two pieces of software talk*: what requests are allowed, what answers come back, in what format.

The restaurant analogy: the **menu** is the API — it lists dishes (operations), how to order (syntax), what you get (response). The kitchen (backend) can change internally, and you never notice as long as the menu stays true.

> [!important] Why APIs are the center of backend
> Nobody — not the browser, not the ESP32 — gets direct database access. **Everything enters through the API.** Design it well → the system stays changeable; design it badly → every client breaks when you refactor.

## Your project's API contract (this table *is* the API)

From `server/src/routes/sensor.routes.js` and `docs/README.md`:

| Method | Full path | Who calls it | Auth? | Purpose |
|--------|-----------|--------------|-------|---------|
| POST | `/api/sensors` | ESP32 (every 500ms) | `x-api-key` | Ingest a reading |
| GET | `/api/sensors` | React dashboard (every 2s) | none | Fetch latest reading |
| GET | `/api/health` | React + monitoring | none | Server + device status |

Read `sensor.routes.js` again: the two lines
```js
router.post('/sensors', apiKeyAuth, sensorController.postSensorData);
router.get('/sensors', sensorController.getLatestSensorData);
```
**are** the first two rows of the table, translated to code. `apiKeyAuth` present on POST = the "Auth?" column = `x-api-key`.

> [!example] Prove the contract with curl
> With the server running:
> - `curl http://localhost:3000/api/sensors` → 200 (public read)
> - `curl -X POST http://localhost:3000/api/sensors -d "{}"` → 401 (needs key)
> - `curl -X POST http://localhost:3000/api/sensors -H "x-api-key: YOURKEY" -H "Content-Type: application/json" -d "{}"` → 400 (key ok, body invalid)
> Three calls, three different outcomes — each one is a row/column of the contract being enforced.

## Where APIs fit in the backend landscape

| Style | Core idea | Best for | Note |
|-------|-----------|----------|------|
| **REST** | Resources + HTTP verbs | CRUD, cacheable | [[05 - REST API Principles]] |
| **GraphQL** | Client asks exact fields | Many clients, linked data | [[11 - GraphQL API]] |
| **RPC/gRPC** | Call a function over the network | internal service calls | [[13 - Backend Developer Roadmap]] |
| **WebSocket** | Persistent two-way channel, server pushes | live dashboards | [[10 - WebSockets for Real-Time Data]] |
| **Webhooks** | Server calls *your* URL on events | payments, GitHub events | [[10 - WebSockets for Real-Time Data]] |

**APIs exist outside HTTP too** — a library function signature is an API; OS syscalls are an API. Same idea: contract over hidden internals. "Backend API" specifically means a **web API** reachable over a network.

## Anatomy of a web API call (3 parts, always)

1. **Request** — `POST /api/sensors` + headers (`Content-Type`, `x-api-key`) + JSON body (from `config.h` + `.ino` on the ESP32)
2. **Processing** — invisible: `apiKeyAuth` → controller → AJV → service (note 06)
3. **Response** — status (`200`/`400`/`401`) + headers + JSON

> [!question] Predict
> The frontend calls `api.getSensorData()` (`frontend/src/services/api.ts:47`). Which of the 3 parts do you control *as the client*, and which does the server control?
>
> > [!success]- Answer
> > Client controls the **request** (method, path, headers). Server controls **processing** and the **response** (status code + body). The API contract is the negotiated middle: client *requests* within the allowed parameters; server *answers* within the promised shape. The frontend relies on `sensorData.status/ageMs/etc.` — those names are the contract.

## Versioning & compatibility (pro habit)

- **Additive change** = safe (new response field, new endpoint).
- **Removing/renaming/retyping** = **breaking** → bump version `/api/v1/...`.
- Your API has no version yet — fine for one client; once external clients exist, add it. (`/api/sensors` → `/api/v1/sensors`.)

> [!bug] Debug challenge
> Someone renames the response field `ageMs` to `data_age_ms` in `sensorStore.service.js`. The server still returns `200` on every curl. But the React dashboard breaks. **Why does a "successful" API change still break a client?** Name the exact frontend line that would break (hint: `frontend/src/types/sensor.ts:28`).

## Build it yourself (no AI)
- [ ] Write the full API contract table (method/path/request/response/errors) for a new **"alerts"** resource you design, on paper, *before* any code.
- [ ] Open DevTools → Network on your dashboard; identify the 3 API calls your app makes and their status codes.
- [ ] In one line each: API vs REST vs GraphQL.

## Resources
- Playlist: [Backend from first principles](https://youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1)
- [MDN: API glossary](https://developer.mozilla.org/en-US/docs/Glossary/API)

Next: [[03 - HTTP Fundamentals]]
