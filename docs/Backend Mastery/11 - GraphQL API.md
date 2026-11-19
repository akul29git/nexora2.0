---
tags:
  - graphql
  - api
---

# 11 — GraphQL API

> [!info] Prerequisites
> [[05 - REST API Principles]], [[10 - WebSockets for Real-Time Data]] (for subscriptions). Next: [[12 - Testing Logging and Production]].

## 1. The problem GraphQL solves

Created at Facebook (2012, open-sourced 2015) because REST served many clients poorly.

- **Over-fetching** — your dashboard needs `tilt_deg` + `latitude`, but `GET /api/sensors` returns **every** field (MPU6050, ultrasonic, sharp_ir, GPS, flags...) every time. Wasted bytes × every 2s poll (note 10).
- **Under-fetching** — a "device + latest reading + alert count" screen needs 3 REST endpoints, 3 round trips.
- **Endpoint explosion** — every client need tempts a new variant: `/sensors/summary`, `/sensors/dashboard`...

> [!abstract] GraphQL's answer
> One endpoint. The **client** declares exactly which fields it wants; the server returns exactly that. New field for a new screen = client change only, **zero** server changes.

REST asks *"which URL?"*; GraphQL asks *"which fields, on which types?"*

> [!question] Predict
> Your dashboard polls `GET /api/sensors` every 2s and only *uses* `status`, `ageMs`, and a few accel fields, but the server sends ~30 fields. Roughly how much bandwidth could GraphQL save, and does it help the **latency** problem from note 10?
>
> > [!success]- Answer
> > Bandwidth: potentially large (if you select 5 of 30 fields). But **latency stays**: GraphQL queries are still request/response over HTTP — the server can't push. For freshness you need **subscriptions** (which run over WebSocket, note 10) or WS push. **GraphQL solves data shape, not push.** Know which problem each tool solves.

## 2. Core concepts (5 words)

| Concept | Meaning |
|---------|---------|
| **Schema** | The complete typed contract — self-documenting |
| **Type** | An object shape (`Sensor`, `Device`) with fields |
| **Query** | Read (≈ GET) |
| **Mutation** | Write (≈ POST/PUT/PATCH/DELETE) |
| **Subscription** | Server push over WebSocket |

## 3. A schema for YOUR data

```graphql
type Mpu6050 {
  ok: Boolean!
  accel_x: Float!
  accel_y: Float!
  accel_z: Float!
  accel_magnitude: Float!
  pitch_deg: Float!
  roll_deg: Float!
  tilt_deg: Float!
}
type Ultrasonic { distance_cm: Float!  obstacle_detected: Boolean! }
type SharpIr    { voltage: Float!  distance_cm: Float! }
type SensorReading {
  device_id: String!
  uptime_ms: Float!
  mpu6050: Mpu6050!
  ultrasonic: Ultrasonic!
  sharp_ir: SharpIr!
  gps_valid: Boolean!
  latitude: Float!
  longitude: Float!
  emergency_button: Boolean!
  crash_detected: Boolean!
  wifi_rssi_dbm: Int!
  status: String!
  ageMs: Float!
}
type Health { status: String!  uptime: Float!  lastEsp32Contact: String  connected: Boolean!  ageMs: Float }

type Query {
  latestReading: SensorReading!
  health: Health!
}
type Mutation {
  ingestReading(input: SensorInput!): SensorReading!
}
type Subscription {
  readingUpdated: SensorReading!
}
```

> [!tip] Compare to your AJV schema
> `validators/sensor.schema.js` validates **one payload's shape at runtime**. A GraphQL schema **defines the whole type system** the API obeys — validation, docs, and query limits all derive from it. Same instinct (types as contract), different altitude. Notice it mirrors `frontend/src/types/sensor.ts` almost 1:1.

## 4. Queries, mutations, resolvers

Client asks:
```graphql
query {
  latestReading {
    device_id
    tilt: mpu6050 { tilt_deg }
    dist: ultrasonic { distance_cm }
    latitude
  }
}
```
Server returns **exactly** that shape:
```json
{ "data": { "latestReading": {
  "device_id": "esp32-01",
  "tilt": { "tilt_deg": 12.4 },
  "dist": { "distance_cm": 43.2 },
  "latitude": 28.7975 } } }
```
Aliases (`tilt:`, `dist:`) rename on the fly; nested selection walks sub-objects.

Resolvers — where each field's value comes from:
```js
const resolvers = {
  Query: {
    latestReading: () => sensorStore.getLatestReading(),
    health: () => sensorStore.getHealthStatus()
  },
  Mutation: {
    ingestReading: (_, { input }) => {
      sensorStore.updateReading(input);
      broadcast('reading', sensorStore.getLatestReading());
      return sensorStore.getLatestReading();
    }
  }
};
```

> [!important] The architectural echo
> The resolvers call the **same `sensorStore` service** your REST controller calls. GraphQL = **another front door on the same house.** REST, GraphQL, and WebSocket handlers coexist, sharing services. That's how real systems migrate gradually.

> [!example] Run it (no AI)
> ```
> npm i graphql graphql-yoga
> ```
> ```js
> const { createYoga } = require('graphql-yoga');
> const yoga = createYoga({ schema, graphqlEndpoint: '/graphql' });
> app.use('/graphql', yoga);   // mount on your existing Express app
> ```
> Visit `http://localhost:3000/graphql` (GraphiQL playground). Run the query above; verify the response contains **only** your selected fields.

> [!question] Quiz
> With GraphQL mounted at `/graphql` and REST at `/api/sensors`, your ESP32 still POSTs to `/api/sensors`. Does anything break?
>
> > [!success]- Answer
> > No. You now run **dual-stack**: device uses REST (simple, stable), dashboard can move to GraphQL incrementally. This is a legitimate, common migration strategy — you don't have to rewrite everything. Services are shared, so data stays consistent.

## 5. Subscriptions (ties back to note 10)
`Subscription.readingUpdated` maps to an event: every `broadcast(...)` becomes `pubsub.publish('READING', { readingUpdated: reading })`. Most servers run subscriptions **over WebSocket** — note 10 is a hard prerequisite, not decoration.

## 6. GraphQL vs REST — honest decision table

| Criterion | REST | GraphQL |
|-----------|------|---------|
| Simple CRUD, few clients | ✅ ideal | overkill |
| Many clients, varying needs | over-fetch/endpoints pain | ✅ ideal |
| Caching | ✅ HTTP-native | ⚠️ needs persisted queries / client cache |
| File upload/streaming | ✅ natural | awkward |
| Realtime | bolt-on (note 10) | ✅ subscriptions (also WS underneath) |
| Auth | header middleware | same — and same vulnerabilities |
| Discoverability | docs/OpenAPI | ✅ free introspection |
| Query cost control | you design limits | ⚠️ add depth/complexity limits yourself |

## 7. The dark side (what tutorials skip)
1. **N+1 problem** — `devices { readings { sensor } }` can explode into 1 + N + N×M DB queries. Fix: **DataLoaders** (batch + cache per tick). Learn it *before* production.
2. **Unbounded queries = DoS** — a client can request 10,000-nested fields. Mitigate with **depth limits**, complexity scoring, timeouts, persisted queries.
3. **Caching is harder** — every body differs, so HTTP caching doesn't apply; use client caches (Apollo/Relay) or persisted queries.
4. **Errors are 200s** — GraphQL returns `200` + `errors[]`; monitoring must read the body. (Notice this *violates* note 03's status discipline — understand both sides.)

## 8. Where it sits in your roadmap
```mermaid
graph LR
    E[ESP32] -->|REST POST| S[Express + sensorStore]
    G[Dashboard GraphQL] --> Q[/graphql]
    Q --> S
    S --> WS[WebSocket push]
    WS --> G
```
One service layer, three doors. Styles are tools, not religions.

## Build it yourself (no AI)
- [ ] Hand-write a minimal schema (start with `Query.latestReading` + 3 fields), wire a resolver to a plain `sensorStore` object, curl a 2-field query; verify only those 2 fields return.
- [ ] In GraphiQL: full query, alias query, omit a `!` field (see the error), ask a non-existent field (validation error **before** any resolver runs).
- [ ] Add `Mutation.ingestReading`; POST through GraphQL; confirm `latestReading` reflects it.
- [ ] (Stretch) Implement `Subscription.readingUpdated` with Yoga's `createPubSub`; subscribe with a WS client; fire the mutation; watch the push.
- [ ] Answer: over- vs under-fetching with a concrete dashboard example. Why does GraphQL make caching harder? What's the N+1 fix?

## Resources
- Playlist: [Backend from first principles](https://youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1)
- [graphql.org — Learn](https://graphql.org/learn/)
- [GraphQL spec](https://spec.graphql.org/)
- [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server/docs) · [Apollo Server](https://www.apollographql.com/docs/apollo-server)
- [GitHub GraphQL API](https://docs.github.com/en/graphql) — study a real production schema

Next: [[12 - Testing Logging and Production]]
