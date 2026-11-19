---
tags:
  - http
  - fundamentals
---

# 03 — HTTP Fundamentals

> [!info] Prerequisites
> [[02 - What Is an API]]. Next: [[04 - HTTP Methods Deep Dive]].
> Every REST/GraphQL/WebSocket interaction rides on HTTP. Learn it once, use it forever.

## What HTTP is

A text-based **request/response** protocol. One rule set both sides obey:

1. Client sends a **request**: start line + headers + optional body.
2. Server sends a **response**: status line + headers + optional body.
3. No memory of prior exchanges unless *you* build it.

## Request anatomy (your ESP32's real request)

```
POST /api/sensors HTTP/1.1
Host: taskcanvas.me
Content-Type: application/json
x-api-key: ********
Content-Length: 412

{"device_id":"esp32-01","uptime_ms":10000,...}
```

| Part | Meaning | Where it comes from |
|------|---------|---------------------|
| Start line | **method** + **path** + version | `config.h:7` (URL) + `.ino` (`HTTPClient`) |
| Headers | metadata: `Content-Type`, `x-api-key` | device code + server expectations |
| Body | the JSON payload | sensors (MPU6050, ultrasonic, sharp_ir, GPS) |

On the server: `req.method`, `req.url`, `req.headers`, `req.body` (after `express.json()`).

## Response anatomy (from your server)

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
RateLimit-Limit: 100
RateLimit-Remaining: 97

{"status":"ok","source":"esp32","deviceId":"esp32-01","ageMs":120,...}
```

> [!question] Predict
> Where in your code is `Content-Type: application/json` set for that response?
>
> > [!success]- Answer
> > `res.json(...)` — Express sets it automatically. In `sensor.controller.js:69`, `res.status(200).json(data)` produces both the status line and the content-type header. If you used `res.send('...')` with a string instead, Express would set `text/html`. `res.json` is the JSON shortcut.

## Status codes — the language of success/failure

> [!important]
> If a client must branch on "did it work?", there must be a **different status code**. Never `200` with `{"error":...}`.

| Range | Meaning | In your project |
|-------|---------|-----------------|
| 2xx | Success | `200` POST received; `200` GET data |
| 4xx | **Client** error | `400` invalid body, `401` bad key, `404` bad path, `413` too big, `429` rate limit |
| 5xx | **Server** error | `500` unhandled (via `errorHandler.js`) |

Memorize: `200/201/204`, `400/401/403/404/409/413/422/429`, `500/502/503/504`.

> [!warning] 401 vs 403 (interview trap)
> `401` = not authenticated (who are you?). `403` = authenticated but not allowed. `middleware/apiKeyAuth.js` returns **401** for missing/wrong key — correct, caller is unidentified. When you add user roles (note 13), a logged-in user hitting an admin route gets **403**.

## Headers you must know

| Header | Direction | Purpose | Your code |
|--------|-----------|---------|-----------|
| `Content-Type` | both | body format | `application/json` |
| `x-api-key` | request | credentials | `apiKeyAuth.js:4` |
| `Content-Length` | request | body size | ESP32 sets it |
| `CORS` (`Access-Control-Allow-*`) | response | browser permission | `app.js` `cors()` |
| `RateLimit-*` | response | request budget | `rateLimiter.js` `standardHeaders:true` |
| `Cache-Control` | response | caching | not set yet — you'll add it |

> [!example] Read real headers right now
> Run `curl -v http://localhost:3000/api/health`. The block starting with `<` is the **response headers**. Find: status line, `Content-Type`, `RateLimit-Limit`, and any `Access-Control-*`. You are reading the raw protocol.

## Safe vs idempotent (know before note 04)

- **Safe** = no side effects (GET, HEAD). Crawlers may call freely.
- **Idempotent** = repeating N times = doing once (GET, PUT, DELETE, HEAD).

Your ESP32 POSTs on a timer. If a response is lost, does it re-send? (Look: does the `.ino` retry on failure, or wait for the next interval?) POST is **not** idempotent, so duplicates matter — but your store accepts "last reading wins," which tolerates it. In payments you'd need an **idempotency key** instead.

> [!question] Quiz
> The ESP32's POST response is lost in transit. The device sends again next interval. Will the server ever store two different readings that cause a bug?
>
> > [!success]- Answer
> > No real bug: `updateReading` just overwrites `lastValidReading` (`sensorStore.service.js:67`). The second POST is harmless because you only *keep the latest*. The design (a "latest value" store) makes the non-idempotent POST effectively safe *for this use case*. A history/append store would need explicit dedup. **Idempotency is a property you design per endpoint.**

## Content types & the 10KB limit

- `express.json({ limit: '10kb' })` (`app.js:50`) — only parses when `Content-Type` matches JSON; over-size → `413` (handled at `errorHandler.js:20`).
- Forms use `express.urlencoded` (`app.js:51`); files need `multer` (not present).

## The request lifecycle in YOUR server

1. `server.js:9` `app.listen(3000)` → opens port.
2. `app.js:14` helmet → `:34` cors → `:47` rateLimiter → `:50` express.json.
3. `app.js:54` `app.use('/api', sensorRoutes)` → routes.
4. Route match → `apiKeyAuth` (`:7` routes) → controller (`:8` routes).
5. Any throw → `errorHandler.js:3` (4-arg function).

> [!bug] Debug challenge
> A developer writes `app.use(errorHandler)` **before** `app.use(express.json())`. Requests with malformed JSON now crash the server instead of returning `400`. **Why?** (Hint: Express tries middlewares in order; the JSON parser throws, but who's downstream to catch it? Since docs advise error handlers last.)

## Build it yourself (no AI)
- [ ] By hand, curl your API and force **each** status code once: 200, 400, 401, 404, 413, 429. Record which file returned each.
- [ ] `curl -v` and underline the response headers. Identify the security headers helmet added.
- [ ] DevTools Network tab: read one real request's method/status/headers/body.
- [ ] Answer: why must there be a distinct status code for every failure mode?

## Resources
- Playlist: [Backend from first principles](https://youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1)
- [MDN: HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)
- [MDN: Status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)

Next: [[04 - HTTP Methods Deep Dive]]
