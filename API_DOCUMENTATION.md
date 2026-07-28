# Room Sync Backend — API & Socket.io Documentation

Complete developer-friendly reference guide for the Room Sync Backend API, covering Authentication, Room Management, and Real-Time Socket.io playback synchronization.

- **Base URL:** `https://shariar_fahim5001.binarybards.online/api`
- **Version:** `v1.0.0`
- **Authentication Protocol:** `Bearer <JWT_TOKEN>`

---

## Table of Contents
1. [Authentication Setup](#1-authentication-setup)
2. [REST API Endpoints](#2-rest-api-endpoints)
   - [Auth Endpoints](#auth-endpoints)
   - [Room Endpoints](#room-endpoints)
3. [Socket.io Event Contracts](#3-socketio-event-contracts)
   - [Connection & Handshake](#connection--handshake)
   - [Client -> Server Events](#client---server-events)
   - [Server -> Client Events](#server---client-events)
4. [Latency Compensation Formula](#4-latency-compensation-formula)
5. [Error Code Reference](#5-error-code-reference)

---

## 1. Authentication Setup

All protected endpoints and Socket.io connections require a valid JWT access token.

### Header Format (REST)
```http
Authorization: Bearer <your_jwt_token>
```

---

## 2. REST API Endpoints

### Auth Endpoints

#### 1. User Signup
Creates a new user account and returns a JWT access token.

- **Endpoint:** `POST /api/auth/signup`
- **Authentication:** None
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "securepassword123"
}
```

**Success Response (`201 Created`):**
```json
{
  "user": {
    "id": "665f8a9b1c2d3e4f5a6b7c8d",
    "username": "alice",
    "email": "alice@example.com",
    "spotifyUserId": null
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request` - Validation error (invalid email format, password too short)
  ```json
  {
    "error": "VALIDATION_ERROR",
    "details": [
      {
        "code": "too_small",
        "minimum": 6,
        "path": ["password"],
        "message": "String must contain at least 6 character(s)"
      }
    ]
  }
  ```
- `409 Conflict` - Email or username already exists
  ```json
  {
    "error": "Error",
    "message": "Email is already in use"
  }
  ```

**Code Example (cURL):**
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "securepassword123"
  }'
```

---

#### 2. User Login
Authenticates an existing user and returns a JWT token.

- **Endpoint:** `POST /api/auth/login`
- **Authentication:** None
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "securepassword123"
}
```

**Success Response (`200 OK`):**
```json
{
  "user": {
    "id": "665f8a9b1c2d3e4f5a6b7c8d",
    "username": "alice",
    "email": "alice@example.com",
    "spotifyUserId": null
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid email or password
  ```json
  {
    "error": "Error",
    "message": "Invalid credentials"
  }
  ```

---

#### 3. Get Current User Profile (`/me`)
Fetches profile details for the authenticated user.

- **Endpoint:** `GET /api/auth/me`
- **Authentication:** Required (`Bearer <token>`)

**Success Response (`200 OK`):**
```json
{
  "id": "665f8a9b1c2d3e4f5a6b7c8d",
  "username": "alice",
  "email": "alice@example.com"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or expired token
  ```json
  {
    "error": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
  ```

---

### Room Endpoints

#### 4. Create Room
Creates a new room with a unique 6-character room code. The authenticated user becomes the **Host**.

- **Endpoint:** `POST /api/rooms`
- **Authentication:** Required (`Bearer <token>`)

**Request Body:** None

**Success Response (`201 Created`):**
```json
{
  "roomCode": "A1B2C3",
  "hostId": "665f8a9b1c2d3e4f5a6b7c8d",
  "isActive": true,
  "playbackState": null
}
```

---

#### 5. Join Room
Joins an active room as a Listener.

- **Endpoint:** `POST /api/rooms/:roomCode/join`
- **Authentication:** Required (`Bearer <token>`)
- **Path Parameters:**
  - `roomCode` *(string, required)* - 6-character room code (e.g. `A1B2C3`)

**Success Response (`200 OK`):**
```json
{
  "roomCode": "A1B2C3",
  "hostId": "665f8a9b1c2d3e4f5a6b7c8d",
  "listeners": [
    "665f8a9b1c2d3e4f5a6b7c8d",
    "665f9c0e2d3e4f5a6b7c8e9f"
  ],
  "playbackState": {
    "currentTrackUri": "spotify:track:4PTG3Z6ehGkBF3zI7Yspqs",
    "currentPositionMs": 42000,
    "isPaused": false,
    "updatedAt": 1722184560000
  }
}
```

> **Client Integration Tip:** App clients should call this REST endpoint first to grab the initial `playbackState` snapshot before connecting to Socket.io.

**Error Responses:**
- `404 Not Found` - Room code does not exist
- `410 Gone` - Room is inactive/closed

---

#### 6. Get Room State
Fetches the current state and playback snapshot of a room. Useful for polling/fallback if sockets disconnect.

- **Endpoint:** `GET /api/rooms/:roomCode`
- **Authentication:** Required (`Bearer <token>`)

**Success Response (`200 OK`):**
Same response payload format as **Join Room**.

---

#### 7. Leave Room
Removes the caller from the room. If the caller is the Host, the room is marked inactive (`isActive: false`).

- **Endpoint:** `POST /api/rooms/:roomCode/leave`
- **Authentication:** Required (`Bearer <token>`)

**Success Response (`200 OK`):**
```json
{
  "left": true,
  "isHost": false
}
```

---

## 3. Socket.io Event Contracts

### Connection & Handshake

Clients connect to the Socket.io server passing the JWT token in `auth`.

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
});
```

---

### Client -> Server Events

#### `join_room`
Subscribes the socket connection to a room channel.

- **Emitted By:** Host & Listener
- **Payload:**
```json
{
  "roomCode": "A1B2C3"
}
```

#### `playback_update`
Pushes host playback state (periodic heartbeats or trigger events on Play/Pause/Seek/Track Change).

- **Emitted By:** Host only
- **Payload:**
```json
{
  "roomCode": "A1B2C3",
  "currentTrackUri": "spotify:track:4PTG3Z6ehGkBF3zI7Yspqs",
  "currentPositionMs": 42000,
  "isPaused": false
}
```

#### `leave_room`
Cleanly unsubscribes from the socket room channel.

- **Emitted By:** Host & Listener
- **Payload:**
```json
{
  "roomCode": "A1B2C3"
}
```

---

### Server -> Client Events

#### `state_update`
Broadcast to all listeners in the room when the host emits a `playback_update`.

- **Payload:**
```json
{
  "roomCode": "A1B2C3",
  "currentTrackUri": "spotify:track:4PTG3Z6ehGkBF3zI7Yspqs",
  "currentPositionMs": 42000,
  "isPaused": false,
  "updatedAt": 1722184560000
}
```

#### `listener_joined`
Emitted to existing members when a user joins the room socket.

- **Payload:**
```json
{
  "userId": "665f9c0e2d3e4f5a6b7c8e9f",
  "username": "bob"
}
```

#### `listener_left`
Emitted to remaining members when a user disconnects or leaves.

- **Payload:**
```json
{
  "userId": "665f9c0e2d3e4f5a6b7c8e9f",
  "username": "bob"
}
```

#### `error`
Emitted to the specific socket if an operation fails.

- **Payload:**
```json
{
  "message": "Only room host can update playback state"
}
```

---

## 4. Latency Compensation Formula

When a Listener receives a `state_update` socket event, calculate the actual current track position to compensate for network latency:

```javascript
const actualPositionMs = currentPositionMs + (Date.now() - updatedAt);
```

### Mobile App Sync Rules:
1. **Seek Threshold:** Only call player `seekTo()` if `abs(localPlayerPosition - actualPositionMs) > 2000ms`.
2. **Track Change:** If `currentTrackUri` changes, call `play(newUri)` immediately.
3. **Play/Pause:** Directly match `isPaused` state.

---

## 5. Error Code Reference

| Status Code | Error Code | Description |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request body or path parameter failed Zod validation rules |
| `401` | `UNAUTHORIZED` | Missing, malformed, or expired JWT token |
| `403` | `FORBIDDEN` | Non-host user attempted host-only action (e.g. updating playback) |
| `404` | `NOT_FOUND` | User or room code not found |
| `409` | `CONFLICT` | Email or username already registered |
| `410` | `GONE` | Room is inactive / closed |
| `500` | `INTERNAL_ERROR` | Server-side database or internal execution failure |
