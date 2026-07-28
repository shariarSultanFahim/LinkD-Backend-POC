# Room Sync Backend — Architecture & API Documentation
### Stack: Express.js + MongoDB (Mongoose) + Socket.io

This document is the build spec for the backend powering **Create Room / Join Room** real-time Spotify playback sync, plus **Login/Signup**. It replaces the Firebase Realtime Database approach from the original architecture doc with a self-hosted Express + Socket.io + MongoDB stack, and adds authentication.

Hand this file to Claude Code / Antigravity as the spec to scaffold the backend.

---

## 1. System Overview

- **Auth**: Email/password signup & login, JWT-based sessions.
- **Rooms**: Any authenticated user can **host** a room or **join** one via a room code.
- **Real-time sync**: Socket.io replaces Firebase's real-time listeners. The Host emits playback state; the server broadcasts it to all Listeners in that room.
- **Persistence**: MongoDB stores Users and Rooms (with current playback state embedded, so late joiners can fetch the latest state via REST before the socket stream takes over).

```
[Host App] --(socket: playback_update)--> [Express + Socket.io Server] --(broadcast)--> [Listener Apps]
                                                    |
                                                 [MongoDB]
                                        (Users, Rooms, PlaybackState)
```

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Server | Express.js |
| Real-time | Socket.io (rooms feature = built-in namespacing per party) |
| Database | MongoDB via Mongoose |
| Auth | JWT (access token) + bcrypt for password hashing |
| Validation | zod or joi |
| Env config | dotenv |

---

## 3. Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── models/
│   │   ├── User.js
│   │   └── Room.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── roomController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── roomRoutes.js
│   ├── sockets/
│   │   ├── index.js
│   │   └── roomSocket.js
│   ├── utils/
│   │   ├── generateRoomCode.js
│   │   └── jwt.js
│   ├── app.js
│   └── server.js
├── .env.example
├── package.json
└── README.md
```

---

## 4. Database Models

### 4.1 User Model (`models/User.js`)

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | auto |
| `username` | String, unique, required | |
| `email` | String, unique, required | |
| `passwordHash` | String, required | bcrypt hash, never returned in API responses |
| `spotifyUserId` | String, optional | for future Spotify account linking |
| `createdAt` | Date | auto |

### 4.2 Room Model (`models/Room.js`)

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | auto |
| `roomCode` | String, unique, required | short shareable code, e.g. `A1B2C3` |
| `hostId` | ObjectId (ref: User), required | |
| `listeners` | [ObjectId] (ref: User) | current members |
| `isActive` | Boolean, default `true` | |
| `playbackState` | Embedded object (see below) | last known state, kept fresh via socket updates |
| `createdAt` | Date | auto |

**`playbackState` sub-schema** (mirrors the original Firebase payload):

```json
{
  "currentTrackUri": "spotify:track:4PTG3Z6ehGkBF3zI7Yspqs",
  "currentPositionMs": 42000,
  "isPaused": false,
  "updatedAt": 1722184560000
}
```

Persisting this on the Room document means a Listener who joins mid-song can `GET /rooms/:code` and immediately know what to sync to, before any socket event arrives.

---

## 5. Authentication Flow

1. `POST /api/auth/signup` → creates user, returns JWT.
2. `POST /api/auth/login` → verifies credentials, returns JWT.
3. Client stores JWT (e.g. secure storage in the Flutter app) and sends it as `Authorization: Bearer <token>` on every REST request **and** as an auth payload when establishing the socket connection.
4. `middleware/auth.js` verifies the JWT for protected REST routes.
5. `sockets/index.js` verifies the JWT during the Socket.io handshake (`socket.handshake.auth.token`) before allowing the client to join any room namespace.

---

## 6. REST API Documentation (for App Developers)

Base URL: `https://<your-server>/api`

All protected endpoints require header:
```
Authorization: Bearer <jwt_token>
```

### 6.1 Auth

#### `POST /auth/signup`
**Body:**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "plaintext_password"
}
```
**Response `201`:**
```json
{
  "user": { "id": "665f...", "username": "alice", "email": "alice@example.com" },
  "token": "eyJhbGciOi..."
}
```
**Errors:** `400` validation, `409` email/username already exists.

---

#### `POST /auth/login`
**Body:**
```json
{ "email": "alice@example.com", "password": "plaintext_password" }
```
**Response `200`:**
```json
{
  "user": { "id": "665f...", "username": "alice", "email": "alice@example.com" },
  "token": "eyJhbGciOi..."
}
```
**Errors:** `401` invalid credentials.

---

#### `GET /auth/me` *(protected)*
Returns the currently authenticated user profile. Useful on app launch to validate a stored token.

**Response `200`:**
```json
{ "id": "665f...", "username": "alice", "email": "alice@example.com" }
```

---

### 6.2 Rooms

#### `POST /rooms` *(protected)* — Create a room (become Host)
**Body:** none required.

**Response `201`:**
```json
{
  "roomCode": "A1B2C3",
  "hostId": "665f...",
  "isActive": true,
  "playbackState": null
}
```

---

#### `POST /rooms/:roomCode/join` *(protected)* — Join a room as Listener
**Response `200`:**
```json
{
  "roomCode": "A1B2C3",
  "hostId": "665f...",
  "listeners": ["665f...", "667a..."],
  "playbackState": {
    "currentTrackUri": "spotify:track:4PTG3Z6ehGkBF3zI7Yspqs",
    "currentPositionMs": 42000,
    "isPaused": false,
    "updatedAt": 1722184560000
  }
}
```
**Errors:** `404` room not found, `410` room inactive.

> App developers should call this REST endpoint first to fetch the current `playbackState` snapshot, then open the Socket.io connection and join the room's socket channel for live updates. This avoids a blank/silent state while waiting for the next periodic host push.

---

#### `GET /rooms/:roomCode` *(protected)* — Fetch current room state
Same response shape as join. Useful for polling/reconnect fallback if sockets drop.

---

#### `POST /rooms/:roomCode/leave` *(protected)*
Removes the caller from `listeners`. If the caller is the Host, the room is marked `isActive: false` and all listeners receive a `room_closed` socket event.

**Response `200`:** `{ "left": true }`

---

## 7. Socket.io Event Contracts

Connect with:
```js
const socket = io("https://<your-server>", {
  auth: { token: "<jwt_token>" }
});
```

After connecting, both Host and Listeners must join the room's socket channel:
```js
socket.emit("join_room", { roomCode: "A1B2C3" });
```

### 7.1 Client → Server events

| Event | Emitted by | Payload | Purpose |
|---|---|---|---|
| `join_room` | Host & Listener | `{ roomCode }` | Subscribes the socket to that room's channel |
| `playback_update` | Host only | see below | Push current playback state (periodic or on Play/Pause/Seek/Skip) |
| `leave_room` | Host & Listener | `{ roomCode }` | Unsubscribe cleanly |

**`playback_update` payload** (Host → Server, mirrors the original Firebase payload):
```json
{
  "roomCode": "A1B2C3",
  "currentTrackUri": "spotify:track:4PTG3Z6ehGkBF3zI7Yspqs",
  "currentPositionMs": 42000,
  "isPaused": false,
  "sentAt": 1722184560000
}
```
The server should:
1. Verify the emitting socket belongs to the Host of `roomCode` (reject silently or emit `error` otherwise).
2. Stamp its own `updatedAt` server-side (or trust `sentAt` — pick one and be consistent; server timestamp is more robust against client clock drift).
3. Persist the new `playbackState` on the Room document.
4. Broadcast `state_update` to everyone else in the room.

### 7.2 Server → Client events

| Event | Sent to | Payload | Purpose |
|---|---|---|---|
| `state_update` | All listeners in room (not the host) | same shape as `playback_update` | Real-time playback sync |
| `room_closed` | All listeners | `{ roomCode }` | Host left / ended the party |
| `listener_joined` | Host + existing listeners | `{ userId, username }` | Optional: live listener count/list |
| `listener_left` | Host + existing listeners | `{ userId, username }` | Optional |
| `error` | The offending socket | `{ message }` | Auth failures, invalid room, not-the-host, etc. |

---

## 8. Server-Side Latency Compensation

Same formula as the original Firebase design, just computed by the app after receiving `state_update` (the server does not need to do this — it only stamps `updatedAt`):

```
actualPositionMs = currentPositionMs + (Date.now() - updatedAt)
```

App developer notes (unchanged from original spec):
- Only call `seekTo()` if `abs(localPosition - actualPositionMs) > 2000–3000ms`.
- If `currentTrackUri` changed, always call `play(uri)` regardless of position drift.
- Match `isPaused` directly — no threshold needed for play/pause state.

---

## 9. Suggested `roomSocket.js` Skeleton

```js
module.exports = function registerRoomSocket(io, socket) {
  socket.on("join_room", async ({ roomCode }) => {
    socket.join(roomCode);
  });

  socket.on("playback_update", async ({ roomCode, currentTrackUri, currentPositionMs, isPaused }) => {
    const room = await Room.findOne({ roomCode });
    if (!room || String(room.hostId) !== String(socket.user.id)) {
      return socket.emit("error", { message: "Not authorized to update this room" });
    }

    const updatedAt = Date.now();
    room.playbackState = { currentTrackUri, currentPositionMs, isPaused, updatedAt };
    await room.save();

    socket.to(roomCode).emit("state_update", {
      currentTrackUri, currentPositionMs, isPaused, updatedAt
    });
  });

  socket.on("leave_room", async ({ roomCode }) => {
    socket.leave(roomCode);
  });

  socket.on("disconnect", async () => {
    // optional: handle cleanup, listener_left broadcast, host-disconnect => room_closed
  });
};
```

---

## 10. Environment Variables (`.env.example`)

```
PORT=4000
MONGO_URI=mongodb://localhost:27017/room_sync
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
```

---

## 11. Build Checklist (for Claude Code / Antigravity)

- [ ] Scaffold Express app with the folder structure above
- [ ] Mongoose connection + User/Room models
- [ ] `bcrypt` password hashing + JWT signing/verification utils
- [ ] Auth routes + controller (`signup`, `login`, `me`)
- [ ] Auth middleware for REST routes
- [ ] Room routes + controller (`create`, `join`, `get`, `leave`) with unique room-code generator
- [ ] Socket.io server attached to the same HTTP server as Express
- [ ] Socket auth handshake middleware (verify JWT before allowing `join_room`)
- [ ] `roomSocket.js` handlers as sketched in §9
- [ ] Basic input validation (zod/joi) on all REST bodies
- [ ] Central error handler middleware
- [ ] `.env.example` + README with run instructions
