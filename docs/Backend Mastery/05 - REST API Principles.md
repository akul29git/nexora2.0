---
tags:
  - rest
  - api
---

# 05 — REST API Principles

> [!info] Prerequisites
> [[04 - HTTP Methods Deep Dive]]. Next: [[06 - Your Codebase Line by Line]].

## What REST is

**REpresentational State Transfer** — an *architectural style* (Roy Fielding, 2000 PhD thesis). Not a protocol or library: a set of **constraints**. Follow them → "REST API". Don't (GraphQL, gRPC) → simply a different style; nothing is wrong with that.

> [!abstract] Mental model
> Model the world as **nouns (resources)**; let **HTTP verbs** act on them. The server holds state; clients transfer *representations* (JSON) of it.

## The 6 constraints (know all 6)

1. **Client–server** — UI and server evolve independently. → your React app vs Express server.
2. **Stateless** — every request carries everything needed. → `x-api-key` is sent on **every** POST (`apiKeyAuth.js:4`); the server doesn't "remember" the device between requests.
3. **Cacheable** — responses declare cacheability via headers. → your `GET /api/sensors` sets **no** cache header; for 2s-polled live data that's acceptable, but a pro sets it deliberately (e.g. `Cache-Control: no-store`).
4. **Uniform interface** — shared grammar: resource URIs, representations, self-descriptive messages, **HATEOAS**.
5. **Layered system** — client sees one URL; behind it: LB → API → service → DB.
6. **Code on demand (optional)** — server ships executable code. Rare.

> [!question] Quiz
> Your `GET /api/sensors` returns the same JSON structure whether data is live, stale, or fallback. Does that make it *not* REST?
>
> > [!success]- Answer
> > No. That's a deliberate uniform-representation choice: one stable shape regardless of state. REST only requires resources be identified and manipulated through representations — it doesn't forbid a consistent schema. The `status` field is part of the representation describing state. Good design, not a REST violation.

## Designing a REST API — the practical rules

### 1. Plural nouns, ownership in the path
```
✅ /api/sensors           collection
✅ /api/sensors/abc123    one item
❌ /api/getSensors        verb in URL
❌ /api/sensors/delete    action in URL
```
Your server follows this: `/api/sensors` is a plural collection. `/api/health` is a pragmatic exception (a "virtual resource") — common and acceptable.

### 2. Method = verb
| Action | Method | Success (textbook) | Your code today |
|--------|--------|--------------------|-----------------|
| Read all/one | GET | 200 | `getLatestSensorData` → 200 |
| Create | POST | **201** + Location | `postSensorData` → 200 (acceptable for ingest) |
| Replace | PUT | 200/201 | not implemented |
| Partial | PATCH | 200 | not implemented |
| Delete | DELETE | 204 | not implemented |

### 3. Query string = filter/sort/page
`GET /api/sensors?status=stale&limit=20` — not `GET /api/staleSensors`.

### 4. Consistent response envelope
Your success body (`sensorStore.service.js`): `{ status, source, deviceId, ageMs, ...reading }`.
Your error body (`sensor.controller.js:16`): `{ error, message, details }`.
Pick one convention and never deviate. (You currently have no formal spec — a pro adds OpenAPI/Swagger.)

### 5. Status codes do the talking
`200` success; `400/401/404/413/429` client; `5xx` server. Your pipeline does this well (`errorHandler.js`).

### 6. Errors are structured, traces are hidden
```js
// errorHandler.js:27-30
res.status(err.status || 500).json({
  error: err.message || 'Internal Server Error',
  ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
});
```
Only leaks `stack` in development. **This is exactly right.**

### 7. Version early
Add `/api/v1/...` once real external clients exist.

### 8. Stateless auth
Credentials in **headers** (`Authorization: Bearer ...`), never in the URL path.

> [!bug] Debug challenge — audit your own API
> Open `server/src` and list every REST rule above that your API **violates or leaves unaddressed**. Expected answers include: no `201` on create, no versioning, no cache headers, GET `/api/health` duplicate route, no CRUD. Write the list — this is a real API review, the daily work of a backend engineer.

## REST vs the alternatives

| Question | REST | GraphQL | WebSocket | RPC |
|----------|------|---------|-----------|-----|
| Unit | Resource | Query over schema | Message/event | Function call |
| Endpoints | Many | Usually one | One upgrade | Per service |
| Shape chosen by | Server | **Client** | Both | Server |
| Direction | Client→server | Client→server | **Both** | Client→server |
| Caching | ✅ HTTP-native | ⚠️ manual | N/A | ⚠️ |
| Your project | ✅ now | [[11 - GraphQL API]] | [[10 - WebSockets for Real-Time Data]] | — |

> [!tip] When NOT to use REST
> - Heavy realtime (use WebSockets, note 10) — REST forces polling, which your dashboard does (`useSensorData.ts` every 2s).
> - Deeply linked data with varying client needs (GraphQL, note 11).
> - Internal high-throughput service-to-service (gRPC).
> REST *is* ideal for: simple CRUD, cacheable public data, webhooks, file download.

## HATEOAS — the constraint people skip
Server responses include links for next actions:
```json
{ "id":"abc123", "_links": { "self":"/api/sensors/abc123", "history":"/api/sensors/abc123/history" } }
```
Rarely fully implemented, but knowing it shows you understand REST beyond tutorials.

## Build it yourself (no AI)
- [ ] **Design first**: write the full REST contract for an "alerts" resource: list, get one, acknowledge (a non-CRUD action → `POST /alerts/:id/ack`), delete. Paper only.
- [ ] Audit your API against the 8 rules; list every gap.
- [ ] Add `res.set('Cache-Control','no-store')` to `getLatestSensorData`; explain why that's correct for live data.
- [ ] Explain why statelessness lets you run 5 identical servers behind a load balancer — and why your **in-memory** `sensorStore` *breaks* that (note 13).

## Resources
- Playlist: [Backend from first principles](https://youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1)
- [Fielding's dissertation, ch.5 (REST)](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)
- [MDN: REST glossary](https://developer.mozilla.org/en-US/docs/Glossary/REST)
- [Microsoft REST API guidelines](https://github.com/microsoft/api-guidelines)

Next: [[06 - Your Codebase Line by Line]]
