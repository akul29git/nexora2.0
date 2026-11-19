---
tags:
  - security
  - validation
  - backend
---

# 09 — Validation, Auth, and Security

> [!info] Prerequisites
> [[08 - Routing Middleware and Project Structure]]. Next: [[10 - WebSockets for Real-Time Data]].

> [!warning] Golden rule
> **Never trust the client.** ESP32 firmware, React bundle, mobile app — all can be spoofed with curl. Validation, auth, limits live on the server or not at all.

## 1. Validation — reject garbage at the door

Your server validates in **three layers**:

| Layer | Tool / file | Catches |
|-------|-------------|---------|
| Shape/types/ranges | **AJV** `validators/sensor.schema.js` | missing/wrong/extra fields, out-of-range |
| Domain sanity | `checkForNaN` `sensor.controller.js:24` | `NaN`/`Infinity` that JSON Schema allows |
| Size | `express.json({limit:'10kb'})` `app.js:50` | memory-exhaustion → 413 |

### Reading your real schema
```js
mpu6050: {
  type: 'object',
  properties: {
    accel_x: { type: 'number', minimum: -160, maximum: 160 },
    ...
  },
  required: ['ok','accel_x','accel_y','accel_z','accel_magnitude','pitch_deg','roll_deg','tilt_deg'],
  additionalProperties: false
}
```
- `required` — absent ≠ null ≠ default. Missing one → 400.
- `minimum/maximum` — physical plausibility (**your sensor datasheet as code**). Accelerometer ±160 m/s², ultrasonic ≥ -1 (because -1 signals "no echo"), lat/lon bounded to ±90/±180.
- `additionalProperties: false` — strict allow-list. Rejects typos/injected fields (slightly brittle on client upgrades — version with your API).

> [!example] Break AJV and read the errors
> POST these (valid key) and study the `details` array each time:
> - `{"device_id":""}` → `minLength`
> - `{"uptime_ms":-5}` → `minimum: 0`
> - `{"mpu6050":{"accel_x":999}}` → `maximum`
> - a valid body **plus** `"hacked":true` → `additionalProperties: false`
> **Reading validator errors is a daily skill.**

> [!question] Predict
> Your ESP32 sends `"sharp_ir":{"voltage":1.2,"distance_cm":44.8}` but you remove `sharp_ir` from `required`. Does the request still validate?
>
> > [!success]- Answer
> > Yes — if a field isn't required and isn't present it's fine. But if present, it must match its `properties`. This is how you make fields **optional-but-validated** (e.g., GPS-off case). Whether a field should be required is a **design decision about your device contract**, not a technical one.

### Where validation runs
1. **In the controller** (your current code) — simple, obvious.
2. **As middleware** (scales) — `router.post('/sensors', apiKeyAuth, validateBody, handle)`. Cleaner, reusable. Do the refactor (note 08).

Order: **auth first, validate second.** Don't spend CPU validating strangers.

## 2. Authentication vs Authorization

| | Question | Your code |
|---|----------|-----------|
| **Authn** | Who are you? | `apiKeyAuth.js` compares `x-api-key` → 401 |
| **Authz** | Are you allowed? | not implemented (one key = full access) |

### Pattern A — API key (yours)
```js
const key = req.headers['x-api-key'];
if (!key) return res.status(401).json({ error: 'API key is required', message: 'Missing x-api-key header' });
if (key !== config.apiKey) return res.status(401).json({ error: 'Unauthorized', message: 'Invalid API key' });
next();
```
- Perfect for **machine-to-machine** (ESP32 → server), stateless.
- Weaknesses: one shared secret; can't revoke per-user; visible in anything holding it.

> [!warning] Three real issues in this exact code
> 1. `!==` is **timing-leaky** — attackers can, in theory, infer the key byte-by-byte. Production uses `crypto.timingSafeEqual`.
> 2. One shared key = no revocation. One key per device (`esp32-01`, `esp32-02`...) lets you kill one device's access.
> 3. The ESP32's key is hard-coded in `esp32/.../config.h`. **Firmware is extractable** — treat that key as semi-public and rotate it periodically. (Serious IoT uses per-device keys + mutual TLS.)

### Pattern B — Sessions
Server stores a session id (memory/Redis); browser gets `Set-Cookie: sid=...` auto-attached. Stateful; ideal for browser logins.

### Pattern C — JWT / Bearer
1. `POST /api/login` → server signs `header.payload.signature`.
2. Client sends `Authorization: Bearer <token>`.
3. Server verifies the **signature** (no DB lookup — that's the point).
Stateless, scales. Weakness: hard to revoke early (short expiry + refresh tokens).

> [!tip] Learning order
> API keys (done) → **sessions+cookies** → **JWT** → OAuth2/OIDC. OAuth is *built on* the previous three — don't start there.

## 3. CORS — why your browser app works

Same-origin policy: a page at `https://nfrontend.taskcanvas.me` can't read responses from another origin unless the API opts in. Your `cors()` config (`app.js:34`) — every line:
```js
const allowedOrigins = ['https://nfrontend.taskcanvas.me','https://taskcanvas.me','http://localhost:5173','http://localhost:3000'];
origin: (origin, callback) => {
  if (!origin) return callback(null, true);            // curl/ESP32 → no Origin → allow
  if (allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error('Not allowed by CORS'));
},
credentials: true,
methods: ['GET','POST','OPTIONS'],                     // PUT/PATCH/DELETE blocked here!
allowedHeaders: ['Content-Type','x-api-key'],
```
- Never `origin: true` (reflect-all = any site can call your API from users' browsers).
- `credentials: true` requires explicit origin, never `*`.

> [!warning] The CORS bug that wastes hours
> Add `DELETE /api/sensors/:id` but forget `'DELETE'` in `methods` → **curl works, browser fails**. CORS is enforced **only by browsers**. If it "works in Postman" but not the app, suspect CORS.

## 4. Rate limiting (`middleware/rateLimiter.js`)
```js
rateLimit({ windowMs: 60_000, max: config.rateLimit, message: { error: 'Too many requests...', status: 429 }, standardHeaders: true });
```
Why: brute-force protection, availability, cost control.
Limitation: keyed by IP — behind a proxy all users share the IP unless `app.set('trust proxy', 1)`. Multi-instance needs a shared store (Redis).

> [!question] Predict
> ESP32 sends every `500ms` (120/min). `RATE_LIMIT=100`. What breaks, and how would it appear on the dashboard?
>
> > [!success]- Answer
> > After ~100 POSTs in a rolling minute, further POSTs get `429`. The store stops updating → `ageMs` grows past `staleAfterMs` → dashboard shows `stale` then `degraded`. Root cause is a **numbers mismatch** between `config.h PACKET_INTERVAL_MS` and `.env RATE_LIMIT`. Fixes: raise the limit, slow the device, or exempt device keys. **Follow config numbers → behavior → user effect.**

## 5. Helmet & security headers
`helmet()` sets CSP (which scripts/styles/connections a page may use), `X-Content-Type-Options`, `X-Frame-Options`, HSTS, etc. Your `connectSrc: ["'self'","https://taskcanvas.me"]` means an injected script couldn't phone home to an attacker. Security headers are nearly free — always ship them.

## 6. Full API security checklist
- [ ] HTTPS in production (else everything above is defeatable on the wire)
- [ ] Validate **every** input (body, params, query, headers)
- [ ] Authn on sensitive routes; authz per role when users arrive
- [ ] Rate limit + body size limit
- [ ] CORS whitelist, never `*` w/ credentials
- [ ] Security headers (helmet)
- [ ] Secrets only in `.env`; `.env.example` for humans; `.env` gitignored
- [ ] Parameterized queries when the DB arrives (SQL injection — note 13)
- [ ] CSRF protection when cookie auth arrives (`SameSite`)
- [ ] No stack traces in prod (`errorHandler.js:29` already gates on NODE_ENV)
- [ ] Log auth failures (`apiKeyAuth` currently doesn't — add it)

> [!bug] Debug challenge
> Make the naive key comparison safe: replace `apiKey !== config.apiKey` with `crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(config.apiKey))`. **But** this throws if the lengths differ — handle that (length check first, still constant-time enough) and confirm invalid keys still get 401 via `npm test`.

## Build it yourself (no AI)
- [ ] Rewrite `apiKeyAuth` to support multiple keys: `API_KEYS=dev1,prod2`; 401 unknown; log rejections (never log the key itself).
- [ ] Attack your own server and record which layer blocks each: wrong key (401), missing key (401), 11KB body (413), 150 rapid requests (429), bad path (404), `device_id:123` (400).
- [ ] Remove `apiKeyAuth` from the POST route; confirm ingestion works without a key; put it back. Feel "works" vs "safe".
- [ ] Add `'PUT','PATCH','DELETE'` + `'x-api-key'` to CORS and prove a cross-origin `DELETE` preflight now passes.
- [ ] Answer: 401 vs 403? API key vs JWT? Why validate after auth, not before?

## Resources
- Playlist: [Backend from first principles](https://youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [AJV](https://ajv.js.org/) · [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) · [helmet](https://helmetjs.github.io/)

Next: [[10 - WebSockets for Real-Time Data]]
