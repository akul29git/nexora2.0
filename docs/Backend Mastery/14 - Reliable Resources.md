---
tags:
  - resources
---

# 14 — Reliable Resources (curated, no filler)

> [!note] Selection rule for this list
> Official documentation, standards bodies (RFC/IETF), creator-published material, OWASP, and books with established reputation. No random blogs, no "10 best frameworks" listicles, no AI-generated tutorials.

## The spine (follow in order)

1. **[Backend from first principles — YouTube playlist](https://youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1)**
   The recommended watch-along for notes 01–12. Same first-principles philosophy: understand the mechanics (ports, requests, sockets) before the frameworks. Watch → type the code yourself → re-explain it in your own words. This is also the spine resource for the [[06 - Your Codebase Line by Line]] walkthrough.

## HTTP & web fundamentals

| Resource | Why |
|----------|-----|
| [MDN — HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview) | Clearest free HTTP explanation; MDN is Mozilla-maintained |
| [MDN — HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) | Reference table you'll revisit for years |
| [MDN — HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) | |
| [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) | The actual standard; read sections on demand, not cover-to-cover |
| [MDN — CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) | The cross-origin model explained correctly |
| [MDN — Glossary (API, REST, ...)](https://developer.mozilla.org/en-US/docs/Glossary) | One-line definitions worth trusting |

## Node & Express

| Resource | Why |
|----------|-----|
| [Node.js docs — `http` module](https://nodejs.org/api/http.html) | What Express is built on |
| [Node.js docs — `events` / `stream`](https://nodejs.org/api/stream.html) | Why `req.on('data')` works |
| [Express official site](https://expressjs.com/) | Guide + API reference; start with "Hello World", Routing, Middleware |
| [The Twelve-Factor App](https://12factor.net/) | 13 short pages on config, logs, env — the ops vocabulary |

## API design

| Resource | Why |
|----------|-----|
| [Roy Fielding — REST dissertation, ch.5](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) | Where REST was defined |
| [Microsoft REST API guidelines](https://github.com/microsoft/api-guidelines) | Industry conventions for resources, versioning, errors |
| [OWASP API Security Top 10](https://owasp.org/www-project-api-security/) | What actually gets exploited in APIs |

## WebSockets & realtime

| Resource | Why |
|----------|-----|
| [RFC 6455 — WebSocket protocol](https://www.rfc-editor.org/rfc/rfc6455.html) | Handshake + framing, straight from the source |
| [MDN — WebSockets API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) | Browser-side reference |
| [`ws` (npm) README](https://github.com/websockets/ws) | The library used in note 10 |
| [Socket.IO v4 docs](https://socket.io/docs/v4/) | Production realtime with reconnection/rooms |
| [MQTT — official docs](https://mqtt.org/) | When devices (ESP32 fleets) enter the picture |

## GraphQL

| Resource | Why |
|----------|-----|
| [graphql.org — Learn](https://graphql.org/learn/) | Short, official, complete foundations |
| [GraphQL spec](https://spec.graphql.org/) | Authoritative |
| [GraphQL Yoga docs](https://the-guild.dev/graphql/yoga-server/docs) | Lightweight server used in note 11 |
| [GitHub GraphQL API](https://docs.github.com/en/graphql) | A serious production schema to study |

## Databases & data

| Resource | Why |
|----------|-----|
| [PostgreSQL official tutorial](https://www.postgresql.org/docs/current/tutorial.html) | Best first SQL course, by the makers |
| [SQLBolt exercises](https://sqlbolt.com/) | Hands-on interactive SQL |
| [Prisma docs](https://www.prisma.io/docs) / [Drizzle ORM](https://orm.drizzle.team/docs/overview) | Modern Node data layers |

## Testing & security

| Resource | Why |
|----------|-----|
| [Jest docs](https://jestjs.io/docs/getting-started) | Your test runner |
| [Supertest](https://github.com/ladjs/supertest) | HTTP integration testing |
| [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) | Authentication, logging, CORS... per-topic checklists |

## Career-grade books (reputation-proven)

| Book | Stage |
|------|-------|
| *Designing Data-Intensive Applications* — Martin Kleppmann | stages 4–5, systems thinking |
| *The Pragmatic Programmer* — Hunt & Thomas | habits, craft |
| *HTTP: The Definitive Guide* — Fielding/Nielson | deep HTTP |
| *Node.js Design Patterns* — Casciaro | stage 3–4 Node architecture |

## How to use any resource (the meta-skill)

1. **Active over passive**: code along, don't watch.
2. **Spaced re-attempt**: rebuild the same note-06 server a week later from memory.
3. **Triangulate**: when two sources disagree, check the RFC/docs — the spec always wins.
4. **Filter ruthlessly**: if a resource can't tell you *why* something works, close it.

---

Back to the map: [[00 - Map of Content]]
