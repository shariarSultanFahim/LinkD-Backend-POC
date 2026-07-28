# LinkD / Room Sync Backend

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey.svg)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-black.svg)](https://socket.io/)
[![MongoDB / Mongoose](https://img.shields.io/badge/MongoDB-Mongoose%208.3-green.svg)](https://mongoosejs.com/)

Backend service for **LinkD (Room Sync)** — a real-time playback synchronization system allowing host and participant users to synchronize music/audio room state, track position, and controls via WebSockets and REST APIs.

---

## 🚀 Features

- 🔐 **User Authentication**: Secure user registration, login, and JWT-based authentication for HTTP and WebSocket handshakes.
- 🏠 **Room Management**: Create public or private rooms, generate unique room codes, manage host permissions, and handle member limits.
- ⚡ **Real-Time Playback Synchronization**: Socket.io event-driven synchronized media playback (play, pause, seek, track change) across multiple clients.
- ⏱️ **Latency Compensation**: Built-in client-server timestamp alignment for drift-free synchronized audio playback.
- 🛡️ **Validation & Security**: Robust schema validation using Zod and secure password hashing with bcryptjs.
- 🏗️ **Clean Architecture**: Decoupled Layered Architecture (Controllers, Services, Repositories, Models, Sockets).

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Web Framework**: Express.js
- **Real-Time Engine**: Socket.io
- **Database**: MongoDB with Mongoose ORM
- **Validation**: Zod
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs

---

## 📁 Project Structure

```
LinkD-Backend/
├── src/
│   ├── config/          # Unified environment & app configuration
│   ├── controllers/     # HTTP route handlers (Auth, Room)
│   ├── middleware/      # Auth verification & async error handling middleware
│   ├── models/          # Mongoose database schemas & models
│   ├── repositories/    # Database abstraction layer
│   ├── routes/          # Express REST API routing definitions
│   ├── services/        # Core business logic
│   ├── sockets/         # Socket.io handlers & WebSocket authentication
│   ├── utils/           # Helper utilities (JWT, code generators)
│   ├── validators/      # Zod validation schemas
│   ├── app.ts           # Express app setup & middleware assembly
│   └── server.ts        # Server entry point & HTTP/Socket.io listener
├── API_DOCUMENTATION.md # Detailed REST API & WebSocket Event specs
├── room_sync_backend_architecture.md # Architecture & system design docs
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies & scripts
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory based on `.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/room_sync
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

---

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) instance running locally or via MongoDB Atlas

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd LinkD-Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   ```bash
   cp .env.example .env
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:5000`.

---

## 📜 NPM Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `ts-node-dev --respawn --transpile-only src/server.ts` | Runs the server in hot-reloading dev mode |
| `npm run build` | `tsc` | Compiles TypeScript source files into `dist/` |
| `npm start` | `node dist/server.js` | Launches the compiled production build |

---

## 🌐 API & Socket Documentation

- Detailed REST API specification and Socket.io event contracts can be found in [API_DOCUMENTATION.md](file:///d:/Fahim/PROJECTS/LinkD-Backend/API_DOCUMENTATION.md).
- System architecture details and data flow diagrams are available in [room_sync_backend_architecture.md](file:///d:/Fahim/PROJECTS/LinkD-Backend/room_sync_backend_architecture.md).

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
