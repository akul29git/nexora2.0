---
tags:
  - server
  - nodejs
  - practice
---

# 07 — Build Your First Server Without AI

> [!info] Prerequisites
> [[03 - HTTP Fundamentals]], [[04 - HTTP Methods Deep Dive]], [[05 - REST API Principles]], and ideally [[06 - Your Codebase Line by Line]]. Next: [[08 - Routing Middleware and Project Structure]].
>
> [!warning] Rules of this note
> 1. **Type every line yourself.** No copy-paste, no AI.
> 2. Run after every step. Break things on purpose. Read errors fully.
> 3. If stuck: re-read the error → re-read the step → re-read your terminal history. Only then seek help.

## Step 0 — Mental model (the whole job in 4 lines)

A web server is a program that (1) **listens** on a TCP port, (2) **parses** bytes as HTTP, (3) **decides** which handler matches, (4) **writes back** a response. Express is a library that does 2–4 for you. You'll build it twice — raw, then Express — so the framework is never a black box.

Setup:
```
node -v                      # need 18+
mkdir server-from-scratch && cd server-from-scratch
npm init -y
```

## Step 1 — The rawest server (`node:http`)

Create `01-raw.js`:
```js
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'hello' }));
});
server.listen(3000, () => console.log('listening on 3000'));
```
Run `node 01-raw.js`, then `curl -v http://localhost:3000/`.

> [!important] Understand every symbol
> - `http.createServer(cb)` — `cb` runs **once per request** with `req`/`res`.
> - `req.method/url/headers` — parsed from the start line + headers.
> - `res.writeHead(status, headers)` — the status line + headers.
> - `res.end(chunk)` — writes body and **finishes**. Forget it → client hangs forever.
> - `server.listen(3000)` — binds the port.

> [!question] Predict
> What does the client do if you delete `res.end(...)` but keep `writeHead`?
>
> > [!success]- Answer
> > The connection hangs open — curl never returns. The browser spinner spins forever. `end()` is what signals "response complete". This mirrors `res.json()` in your real controller, which ends the response for you.

## Step 2 — Routing by hand

Create `02-router.js`:
```js
const http = require('http');
const server = http.createServer((req, res) => {
  const send = (status, obj) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
  };
  if (req.method === 'GET' && req.url === '/api/health') {
    return send(200, { status: 'healthy', uptime: process.uptime() });
  }
  if (req.method === 'GET' && req.url === '/api/sensors') {
    return send(200, { status: 'fallback', source: 'fallback' });
  }
  send(404, { error: 'Not found' });
});
server.listen(3000, () => console.log('listening on 3000'));
```
Test: `curl .../api/health`, `.../api/sensors`, `.../nope`.

- The early `return` prevents "headers already sent" crashes.
- **This `if` ladder is exactly what Express's router does** — with a table instead of a ladder. Compare to `routes/sensor.routes.js`.

> [!question] Predict
> `curl "http://localhost:3000/api/sensors?x=1"` — does it match the `/api/sensors` handler?
>
> > [!success]- Answer
> > No! `req.url` includes the query string, so it's `/api/sensors?x=1`, which ≠ `/api/sensors`. The handler misses → 404. Real frameworks strip the query string first. Fix by comparing `req.url.split('?')[0]`. **This is why routing is non-trivial** — and why frameworks exist.

## Step 3 — Reading a JSON body by hand

Add to the file:
```js
const readBody = (req) => new Promise((resolve, reject) => {
  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
    if (data.length > 10240) { reject(new Error('payload too large')); req.destroy(); }
  });
  req.on('end', () => resolve(data));
  req.on('error', reject);
});
```
and a POST branch:
```js
if (req.method === 'POST' && req.url === '/api/sensors') {
  try {
    const data = JSON.parse(await readBody(req));
    if (typeof data.uptime_ms !== 'number') return send(400, { error: 'uptime_ms must be a number' });
    latest = data;
    return send(200, { message: 'Data received successfully', status: 'ok' });
  } catch (err) { return send(400, { error: err.message }); }
}
```
Test: `curl -X POST http://localhost:3000/api/sensors -H "Content-Type: application/json" -d "{\"device_id\":\"esp32-01\",\"uptime_ms\":5000}"`.

> [!important] Connect it to note 06
> - `req.on('data')/end` = **manually assembling chunks** → this is literally what `express.json()` does (`app.js:50`).
> - The 10KB guard = `express.json({limit:'10kb'})`.
> - The `typeof uptime_ms` check = a hand-rolled version of AJV (`validators/sensor.schema.js`).
> - `latest = data` = your entire "database" → compare `sensorStore.service.js:68`.

## Step 4 — Replace the ladder with Express

```
npm install express
```
Create `04-express.js`:
```js
const express = require('express');
const app = express();
app.use(express.json({ limit: '10kb' }));
let latest = null;
app.get('/api/health', (req, res) => res.json({ status: 'healthy', uptime: process.uptime() }));
app.post('/api/sensors', (req, res) => {
  if (typeof req.body.uptime_ms !== 'number') return res.status(400).json({ error: 'uptime_ms must be a number' });
  latest = req.body;
  res.json({ message: 'Data received successfully', status: 'ok' });
});
app.get('/api/sensors', (req, res) => {
  if (!latest) return res.json({ status: 'fallback', source: 'fallback' });
  res.json({ status: 'ok', source: 'esp32', ...latest });
});
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.listen(3000, () => console.log('listening on 3000'));
```
Verify the same 4 curls produce **identical output**. Then map what Express gave you for free:

| Hand-rolled | Express | Your real file |
|-------------|---------|----------------|
| `if (method && url)` ladder | `app.get/post(path, handler)` | `routes/sensor.routes.js` |
| `readBody` + `JSON.parse` | `express.json()` | `app.js:50` |
| `writeHead` + `JSON.stringify` | `res.status(n).json(obj)` | `sensor.controller.js` |
| final `send(404,...)` | `app.use((req,res)=>...)` last | `app.js:64` `notFound` |

> [!important] Lesson of step 4
> You now know what Express *is*. A framework is convenience over mechanics you've personally performed. That's the difference between using one and understanding one.

## Step 5 — Split into the real architecture

```
├── server.js         ← only listen + shutdown  (server/src/server.js)
├── app.js            ← only middleware + mounts (server/src/app.js)
├── routes/sensor.routes.js
├── controllers/sensor.controller.js
├── services/sensorStore.js
└── middleware/apiKeyAuth.js
```

**Dependency rule (memorize):** `routes → controllers → services`, never backwards. Services never touch `req`/`res` — that's what makes them reusable (a WebSocket handler in note 10 calls the same service).

Build each file yourself, then diff against `server/src/*`. They should look obvious.

> [!question] Predict
> In your split architecture, where does "is the data stale?" live — controller, route, or service? And why **not** the controller?
>
> > [!success]- Answer
> > In the **service** (`sensorStore.getLatestReading`). It's a business rule, not an HTTP concern. The controller only translates HTTP↔domain. If staleness lived in the controller, a WebSocket broadcast or a cron job couldn't reuse it. **Rules live in services; HTTP lives in controllers.**

## Step 6 — The capstone: rebuild your real API

Without looking at the source, recreate the contract in `docs/README.md`:
- [ ] `POST /api/sensors` — key check → 401; validate → 400; success → 200
- [ ] `GET /api/sensors` — always 200, with `ok`/`stale`/`fallback` + `ageMs`
- [ ] `GET /api/health` — healthy/degraded/unhealthy
- [ ] 404 catch-all, 500 handler, 10KB limit
- [ ] Verify with the exact curls in README §8.

Acceptance: all README §8 curls behave as documented. **Then** open `server/src/app.js` and list every difference between yours and theirs — those differences are notes 08–09.

> [!bug] Debug challenge — the server that "doesn't work"
> You run your new server, curl `/api/sensors`, and get an empty reply (curl error 52). Three candidate causes: (a) forgot `res.end/res.json` in that handler, (b) `server.listen` never called, (c) path typo → fell into a handler that never responds. How do you tell them apart quickly? (Answer: add `console.log(req.method, req.url)` at entry — if you see the path, it's (a); if you see nothing, it's (b)/(c).)

## Debugging habits (the actual pro skill)
1. **Reproduce** with the smallest curl.
2. **Read the whole stack trace** — bottom = what, top frames = where.
3. **Log strategically** — method+url at entry.
4. **Bisect** — disable half the middleware; if fixed, the bug is in that half.
5. **Check assumptions last** — 80% of "the framework is broken" is a wrong URL/port/header.

## Resources
- Playlist: [Backend from first principles](https://youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1)
- [Node.js `http` docs](https://nodejs.org/api/http.html)
- [Express: Hello World](https://expressjs.com/en/starter/hello-world.html) · [Express: Routing](https://expressjs.com/en/guide/routing.html)

Next: [[08 - Routing Middleware and Project Structure]]
