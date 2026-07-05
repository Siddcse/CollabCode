<div align="center">
  <img src="https://img.shields.io/badge/CollabCode-Enterprise%20Code%20Editor-7C3AED?style=for-the-badge&logo=visual-studio-code" />
  <br /><br />
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socketdotio" />
  <img src="https://img.shields.io/badge/Monaco_Editor-0.55-007ACC?style=flat-square&logo=visual-studio-code" />
  <img src="https://img.shields.io/badge/Docker-Sandboxed-2496ED?style=flat-square&logo=docker" />
</div>

---

# CollabCode — Enterprise Real-Time Collaborative Code Editor

> A production-grade, VS Code–inspired collaborative code editor where multiple users can edit code simultaneously, communicate via chat, and execute code securely inside ephemeral Docker containers — all with sub-100ms latency.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔴 **Live Collaboration** | Real-time cursor sync, live typing, and presence indicators |
| 🧠 **Monaco Editor** | VS Code–grade editing with IntelliSense for 8+ languages |
| 🐳 **Secure Execution** | Code runs in ephemeral Docker containers with memory/CPU limits |
| 💬 **Group Chat** | Real-time chat with emoji support and join/leave notifications |
| 📁 **File Explorer** | Create, rename, delete, upload, and download files |
| 🕐 **Version History** | Auto-save snapshots with timeline view and restore |
| 🔗 **Room System** | Share rooms via unique `ABCD-1234` codes |
| 🌙 **Dark Mode** | VS Code–inspired dark theme by default |

---

## 🏗️ Architecture

```
Browser (Next.js 15 on Vercel)
      │  REST (React Query)
      │  WebSocket (Socket.IO)
      ▼
┌──────────────────────────────────┐
│   Express 5 + Socket.IO Backend  │   (Railway / Render)
│  ┌──────┐  ┌─────────┐  ┌─────┐ │
│  │ Auth │  │  Rooms  │  │  OT │ │
│  └──────┘  └─────────┘  └─────┘ │
└──────────────────────────────────┘
         │                │
    ┌────▼────┐     ┌──────▼──────┐
    │  Redis  │     │   Docker    │
    │  Cache  │     │  Containers │
    └─────────┘     └─────────────┘
         │
    ┌────▼────┐
    │ MongoDB │
    └─────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** (App Router) + **React 19** + **TypeScript 5.8**
- **Monaco Editor** (`@monaco-editor/react`) — VS Code editing engine
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — accessible component library
- **Zustand 5** — client state management
- **React Query 5** — server state & caching
- **Motion** (framer-motion v12+) — animations
- **Socket.IO Client 4** — real-time communication

### Backend
- **Node.js 22** + **Express 5** + **TypeScript 5.8**
- **Socket.IO 4** — WebSocket server with rooms
- **Mongoose 9** + **MongoDB 7** — database
- **ioredis 5** + **Redis 7** — caching & pub/sub
- **dockerode 5** — Docker SDK for code execution
- **BullMQ** — background job queues
- **Zod** — runtime validation

### Infrastructure
- **Docker Compose** — local dev (Redis + MongoDB + backend)
- **Vercel** — frontend deployment
- **Railway** — backend deployment
- **GitHub Actions** — CI/CD pipelines

---

## 📁 Folder Structure

```
collabcode/
├── packages/
│   └── shared/           # Shared TypeScript types (frontend + backend)
├── frontend/             # Next.js 15 App Router
│   ├── app/
│   │   ├── page.tsx      # Landing page
│   │   ├── auth/         # Guest login
│   │   ├── dashboard/    # Room dashboard
│   │   └── room/[id]/    # Editor screen
│   ├── components/       # Reusable UI components
│   ├── services/         # API + Socket.IO clients
│   ├── store/            # Zustand stores
│   └── hooks/            # Custom React hooks
├── backend/              # Express + Socket.IO
│   └── src/
│       ├── config/       # env, db, redis
│       ├── controllers/  # HTTP handlers
│       ├── routes/       # Express routes
│       ├── socket/       # Socket.IO event handlers
│       ├── services/     # OT, Docker, room logic
│       ├── models/       # Mongoose schemas
│       ├── middlewares/  # auth, errors, rate limit
│       └── workers/      # Worker threads
├── docker/
│   └── runners/          # Language-specific Docker images
├── .github/
│   └── workflows/        # CI/CD pipelines
└── docker-compose.yml    # Local dev services
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 22.0.0
- npm ≥ 10.0.0
- Docker Desktop (for code execution + local services)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/collabcode.git
cd collabcode
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start infrastructure services
```bash
docker-compose up -d mongo redis
```

### 4. Install dependencies
```bash
npm install --legacy-peer-deps       # root
npm install --legacy-peer-deps -w backend
npm install --legacy-peer-deps -w frontend
```

### 5. Start development servers
```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

Frontend: http://localhost:3000  
Backend: http://localhost:4000

---

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | `4000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/collabcode` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | *(must set)* |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |
| `DOCKER_SOCKET_PATH` | Docker socket path | `//./pipe/docker_engine` (Windows) |
| `EXECUTION_TIMEOUT_MS` | Max execution time | `10000` |
| `NEXT_PUBLIC_WS_URL` | Backend WebSocket URL | `http://localhost:4000` |
| `NEXT_PUBLIC_API_URL` | Backend REST API URL | `http://localhost:4000/api` |

See `.env.example` for the complete list.

---

## 🌐 API Reference

### REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/room/create` | Create a new room |
| `POST` | `/api/room/join` | Join an existing room |
| `GET` | `/api/room/:id` | Get room details |
| `POST` | `/api/code/run` | Execute code in Docker |
| `GET` | `/api/history/:room` | Get version history |
| `POST` | `/api/history/save` | Save a version snapshot |

### Socket.IO Events

**Client → Server:**
`join-room`, `leave-room`, `code-change`, `cursor-change`, `chat-message`, `run-code`, `typing`, `language-change`, `file-create`, `file-delete`

**Server → Client:**
`room-users`, `code-update`, `cursor-update`, `chat-update`, `execution-result`, `user-joined`, `user-left`, `typing-status`, `language-updated`, `file-updated`

---

## 🚢 Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_WS_URL=https://your-backend.railway.app`
- `NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api`

### Backend → Railway
```bash
npm install -g @railway/cli
railway login
railway up
```

Set environment variables in Railway dashboard (see `.env.example`).

---

## 🗺️ Roadmap

- [ ] Google / GitHub OAuth
- [ ] CRDT (Yjs) for conflict resolution
- [ ] Voice chat
- [ ] Whiteboard / diagram mode
- [ ] VS Code extension
- [ ] Self-hosted deployment (Helm chart)
- [ ] AI code suggestions (Gemini API)
- [ ] Mobile app (React Native)

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
  Built with ❤️ using Next.js, Express, and Docker
</div>
