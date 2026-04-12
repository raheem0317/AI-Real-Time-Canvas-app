# AI Real-Time Canvas

A real-time collaborative canvas application where users enter natural language prompts and AI generates structured shape layouts rendered on an interactive canvas. All changes sync across connected clients via WebSockets.

![AI Canvas](https://img.shields.io/badge/React-18-blue) ![Socket.io](https://img.shields.io/badge/Socket.io-4-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Konva](https://img.shields.io/badge/Konva-9-orange)

## ✨ Features

- **AI-Powered Shape Generation** — Enter prompts like _"Create a star layout with 7 nodes"_ and get instant visual output
- **Draggable Shapes** — Click and drag any shape on the canvas
- **Real-Time Sync** — Open multiple tabs and see changes sync instantly via WebSockets
- **Canvas Persistence** — State survives page refreshes (localStorage + server memory)
- **Smart Fallback** — Works without any API key using structured pattern matching
- **Premium Dark UI** — Glassmorphism design with smooth micro-animations

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Canvas | React Konva |
| State | Zustand |
| Backend | Node.js + Express + Socket.io |
| AI | Google Gemini API (with structured fallback) |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install all dependencies (root + server + client)
npm run install:all
# Also install root deps
npm install
```

### Environment Setup (Optional)

For AI-powered generation, create a `.env` file in the `server/` directory:

```bash
cp server/.env.example server/.env
# Edit server/.env and add your Gemini API key
```

> **Note:** The app works fully without an API key — it uses intelligent pattern matching as a fallback.

### Running the App

```bash
# Start both server and client together
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

### Running Separately

```bash
# Terminal 1: Start backend
npm run dev:server

# Terminal 2: Start frontend
npm run dev:client
```

## 🧪 Sample Prompts

| Prompt | Result |
|--------|--------|
| "Create a star layout with 1 center node and 6 surrounding nodes" | Star pattern |
| "Create a 3x4 grid of circles labeled A–L" | 3×4 grid |
| "Create 4 rectangles in a row and 1 circle above center" | Mixed layout |
| "Create 5 circles in a star layout" | 5-node star |

## 🔄 Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `canvas:generate` | Client → Server | Send prompt for AI processing |
| `canvas:generated` | Server → All Clients | Broadcast generated shapes |
| `node:move` | Client → Server | User drags a shape |
| `node:moved` | Server → Other Clients | Broadcast position update |
| `canvas:state` | Server → Client | Sync state on connect |
| `canvas:clear` | Client → Server | Clear the canvas |

## 📐 Architecture

```
Client (React + Konva)
    ↕ Socket.io WebSocket
Server (Node.js + Express)
    ↕ API Call / Fallback
AI Layer (Gemini / Pattern Matching)
```

## 📦 Project Structure

```
├── client/                  # React frontend
│   └── src/
│       ├── components/      # Canvas, ShapeNode, PromptInput, Header
│       ├── store/           # Zustand state management
│       ├── socket/          # Socket.io client
│       └── types/           # TypeScript types
├── server/                  # Node.js backend
│   └── src/
│       ├── ai/              # Gemini AI integration
│       ├── utils/           # Fallback logic
│       └── types/           # Shared types
└── README.md
```

## 🛠 AI Tool Used

- **Claude (Anthropic)** — Used for architectural design, code generation, and implementation
- **Google Gemini API** — Used at runtime for prompt-to-JSON shape generation

## 🔮 What I'd Improve

- **Undo/Redo** — Add history stack for shape operations
- **Shape Editing** — Allow resizing, color changing, and label editing on click
- **Room System** — Multiple canvas rooms with unique URLs
- **Database Persistence** — Replace in-memory state with Redis or MongoDB
- **Shape Animations** — Animate shapes appearing/moving with spring physics
- **Export** — Export canvas as PNG/SVG
- **Authentication** — User accounts and saved canvases
- **Mobile Touch** — Better touch support for mobile devices

## 📄 License

MIT
