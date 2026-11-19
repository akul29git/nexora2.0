---
tags:
  - roadmap
  - career
---

# 13 — Backend Developer Roadmap: Beginner → Pro

> [!info] Prerequisites
> Work through [[00 - Map of Content]] notes 01–12 first. This note is the map *beyond* them.

> [!abstract] The pro definition used here
> A pro backend developer can take a vague requirement → design API + data model → build it with tests → deploy it with monitoring → defend it against abuse → **explain every trade-off out loud.** Not: "knows many frameworks."

## Where you are right now (based on this project)

You have:
- ✅ REST API with POST/GET, correct status codes, middleware chain (`server/src/app.js`)
- ✅ Validation (AJV), auth (API key), CORS, rate limiting, helmet (notes 08–09)
- ✅ Structured-ish logging, graceful shutdown, Jest/Supertest tests (note 12)
- ✅ WebSocket push plan (note 10), GraphQL exposure plan (note 11)
- ⬜ **Persistence** — your data dies on restart (`sensorStore.service.js` is a variable). Biggest gap.
- ⬜ Users, sessions, real authorization (per-device keys at minimum)
- ⬜ Multi-instance deployment (in-memory store blocks it)

> [!question] Self-check
> If your server restarts, what happens to `GET /api/sensors`? Which file, which lines, cause it — and what's the one architectural change that fixes it?
>
> > [!success]- Answer
> > It returns `fallback` because `lastValidReading = null` after boot (`sensorStore.service.js:5-9`). Fix: put readings in a **database** and make `sensorStore` read from it — a *repository* layer (below). Same service interface, durable data.

## Stage 1 — Foundations (weeks 1–4) ✅ this vault
Own completely: HTTP, REST design, Express internals, middleware, validation, security basics, testing habits, WebSocket protocol.

**Milestone:** extend *this* server: a `/api/sensors/history` endpoint with an in-memory ring buffer, a WebSocket dashboard (note 10), full CRUD for virtual "devices", 20+ passing tests, deployed with HTTPS.

## Stage 2 — Persistence (weeks 4–8) 🔥 next

| Topic | Learn | Do |
|-------|-------|-----|
| Relational modeling | tables, keys, relations, basic normalization | design `devices`, `readings`, `users` on paper first |
| SQL | SELECT/JOIN/GROUP BY/INDEX — **by hand, no ORM first** | query your readings: avg tilt per hour |
| PostgreSQL (prod) / SQLite (learn) | install, psql, backups | store every ESP32 reading; survive a restart |
| Node drivers | `pg` (raw SQL) → then **Prisma** or Drizzle | rewrite `sensorStore` as a repository — routes unchanged (note 08 payoff) |
| Migrations | versioned schema changes | add a column via migration and deploy |

**Milestone:** restart mid-stream; dashboard reconnects; history intact. Run **two** copies against one DB — data stays consistent (this is *why* stateless + shared DB is the architecture).

> [!tip] Refactor, don't rewrite
> Keep `getLatestReading()`/`updateReading()` as the interface. Inside, swap the in-memory reads/writes for SQL. Your controller, routes, tests and frontend **never notice** — proof you structured it right (note 08).

## Stage 3 — Users and real auth (weeks 8–12)
1. **Password auth done right** — bcrypt/argon2 hashing (never roll your own), then session cookie *or* JWT pair (access + refresh).
2. **Authorization** — roles/permissions; ownership checks ("users read only their devices' readings") → this is where **403** appears (note 03).
3. **OAuth2/OIDC** — "Sign in with Google"; authorization-code flow + PKCE.
4. **Per-device API keys** — replace the single shared key (note 09) so one device can be revoked.

**Milestone:** multi-user version; ESP32 keys scoped per device; revoking one key kills only that device.

## Stage 4 — Production infrastructure (weeks 12–16)
- **Redis**: cache hot reads, sessions across instances, **pub/sub** so WebSocket broadcasts reach clients on *other* instances (the fix for note 11's scaling caveat).
- **Message queues** (BullMQ/RabbitMQ/SQS): ESP32 POST → enqueue → worker writes DB. Decouples ingestion spikes; retries for free. IoT ingestion is a textbook queue use-case.
- **Docker + compose**: server + Postgres + Redis as one `docker compose up`.
- **CI/CD**: GitHub Actions lint+test on PR, deploy on merge.
- **Observability**: Prometheus + Grafana + alerting; ship structured logs.

**Milestone:** kill an instance mid-traffic; users notice nothing (LB + ≥2 instances + shared Redis/DB).

## Stage 5 — Scale and design (months 4+)
- **System design**: load balancing, CAP theorem, replication, sharding, partitioning **time-series** data (your readings table *is* time-series → InfluxDB/TimescaleDB exist for this).
- **Read the classic**: *Designing Data-Intensive Applications* (Kleppmann), ch. 1–3 then 5–7 — maps onto everything above.
- **gRPC/Protobuf** for internal calls; **event-driven** (Kafka) at serious scale.
- **API gateway patterns**, idempotency keys, per-endpoint rate limits, backpressure.
- **Security deep-dive**: threat-model and pen-test your own API.

**Milestone:** a design doc for "10,000 devices × 1 reading/sec" — storage math, partitioning, fan-out — reviewed by someone better than you.

## Skill matrix (honest self-assessment)
Rate 1–5; no 5s on the first two rows before calling yourself "pro":

| Skill | 1–5 |
|-------|-----|
| HTTP semantics, status codes, headers | |
| REST API design on paper | |
| Express internals (middleware order, error flow) | |
| SQL (joins by hand) | |
| Data modeling | |
| Auth (sessions, JWT, OAuth concepts) | |
| Testing (unit + integration, CI) | |
| WebSockets/realtime | |
| Docker & deployment | |
| Caching & queues | |
| Reading stack traces fast | |
| Explaining trade-offs clearly | |

## Anti-patterns that mark a junior
1. Framework-hopping without HTTP depth.
2. Microservices before one solid monolith works.
3. Secrets in code; logging passwords; `origin: true` on CORS.
4. "It works" with no tests, no health check, no error handling on external input.
5. Optimizing before measuring; Redis before Postgres.
6. Copy-pasting security middleware without knowing each header's job.

## The compounding habit (how people actually get good)
- **Rebuild** this project from scratch quarterly — each rebuild is visibly better; that gap *is* progress.
- **Read production code** (Express, Fastify, Prisma drivers).
- **Postmortems**: read public incident reports — how backends really fail.
- **Constraints**: "serve 10k readings/sec on a $5 VPS" teaches more than another tutorial.
- **Teach**: write notes like these — explaining exposes gaps.

## Resources
- Playlist: [Backend from first principles](https://youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1) — the spine of stages 1–2
- [The Twelve-Factor App](https://12factor.net/)
- [Designing Data-Intensive Applications](https://dataintensive.net/) (book — stages 4–5)
- [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial.html) · [SQLBolt](https://sqlbolt.com/)
- [Prisma](https://www.prisma.io/docs) / [Drizzle](https://orm.drizzle.team/docs/overview)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

Next: [[14 - Reliable Resources]]
