# Agents in Everyday Work

A full-stack chat application featuring a Python FastAPI backend with agent-like capabilities (powered by the Gemini API) and a Next.js frontend with real-time streaming, function calling, and file support.

---

## 🚀 Features

- **Agent Framework**: Gemini-powered agent that can use tools to answer questions.
- **Function Calling**: Responds to queries about weather, math, time, and currency conversion by calling internal tools.
- **File Uploads**: Supports image and audio file attachments in chat.
- **Voice-to-Text**: Record and transcribe audio directly in the chat input.
- **Real-time Streaming**: Model responses stream in real-time using Server-Sent Events.
- **Conversation History**: Maintains context for coherent, multi-turn conversations.
- **Markdown Support**: Renders rich text, code blocks, and lists.
- **Configurable AI**: Adjust temperature, model, and token limits on the fly.
- **Connection Monitoring**: Real-time status and auto-reconnect.
- **Docker Support**: One-command setup with Docker Compose.
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS.

---

## 🏗️ Architecture

```
google-workshop-demo/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # Pydantic models
│   │   ├── services/       # Gemini API logic & tools
│   │   ├── routes/         # API endpoints
│   │   └── main.py         # FastAPI app
│   ├── pyproject.toml      # Python deps
│   └── Dockerfile          # Backend container
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utilities
│   ├── package.json       # Node.js deps
│   └── Dockerfile         # Frontend container
├── docker-compose.yml     # Multi-container setup
└── README.md
```

---

## 🛠️ Tech Stack
**Backend:** FastAPI, Google Generative AI SDK, Pydantic, Uvicorn, SlowAPI, python-dotenv, python-multipart

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, Lucide React, React Hot Toast, Framer Motion, React Markdown

---

## 📋 Prerequisites
- Python 3.12+
- Node.js 18+
- Docker & Docker Compose (recommended)
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd google-workshop-demo
   ```
2. **Set your Gemini API key**
   In your shell, export the API key. This will be passed to the Docker container.
   ```bash
   export GEMINI_API_KEY="your_gemini_api_key_here"
   ```
3. **Start all services**
   ```bash
   docker-compose up --build
   ```
4. **Access the app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Local Development
Follow the same setup for environment variables as described in the Docker section, but create `.env` files.

#### Backend
1. **Install dependencies**
   ```bash
   cd backend
   uv sync
   ```
2. **Set environment variables**
   - Create a `.env` file in `backend/` with:
     ```env
     GEMINI_API_KEY="your_gemini_api_key_here"
     ```
3. **Run the backend**
   ```bash
   uv run dev
   ```

#### Frontend
1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```
2. **Configure environment**
   - Copy `env.local.example` to `.env.local`:
     ```bash
     cp env.local.example .env.local
     ```
     The default settings should work for local development.
3. **Run the frontend**
   ```bash
   npm run dev
   ```

---

## 🔧 Configuration

### Backend (`backend/.env`)
- `GEMINI_API_KEY` (required): Your API key for the Gemini service.

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000/api/v1`): URL of the backend API.
- `NEXT_PUBLIC_APP_NAME` (default: `Agent Chat`): The application name displayed in the UI.

---

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1`.

- `GET /health`: Health check for API and Gemini connection status.
- `GET /models`: Fetches a list of available Gemini models.
- `GET /functions`: Lists all available tools the agent can use (e.g., `get_weather`, `calculate_math`).

- `POST /chat`: The main chat endpoint. It accepts `multipart/form-data` including:
  - `message` (string): The user's message.
  - `conversation_history` (string): A JSON-serialized array of previous messages.
  - `files` (file): One or more files (image or audio).
  - Other optional parameters like `model`, `temperature`, etc.

- `POST /chat/transcribe`: Transcribes an audio file into text.
  - `file` (file): The audio file to transcribe.

For detailed request/response schemas, see the auto-generated OpenAPI docs at `http://localhost:8000/docs`.

---

## 🎨 UI Features
- **Function Calling**: A "zap" icon indicates when the agent can use tools. The placeholder text also provides examples.
- **File Attachments**: Attach images or audio using the paperclip icon. Previews show file info and allow removal.
- **Voice Recording**: Use the microphone icon to record audio, which is then transcribed and added to the input field.
- **Streaming & Markdown**: Messages stream in and are rendered with full Markdown support.
- **Configuration Panel**: A sidebar allows real-time adjustment of the model, temperature, and token limits.

---

## 📦 Development
Standard linting, formatting, and type-checking scripts are available in both `frontend` and `backend` directories.

- **Backend:**
  ```bash
  cd backend
  black .
  isort .
  flake8 .
  mypy .
  ```
- **Frontend:**
  ```bash
  cd frontend
  npm run lint
  npm run type-check
  npm run format
  ```

---

## 🚀 Deployment
- **Docker Compose:**
  ```bash
  docker-compose up --build -d
  ```
- **Logs:**
  ```bash
  docker-compose logs -f
  ```
- **Stop:**
  ```bash
  docker-compose down
  ```

**Production tips:**
- Set `DEBUG=false` in production.
- Use proper CORS origins.
- Configure rate limiting.
- Set up monitoring/logging.
- Use HTTPS.
- Consider a reverse proxy (nginx).

---

## 🛠️ Troubleshooting
- **Gemini API key errors:** Ensure your key is valid and has quota.
- **Port conflicts:** Make sure ports 3000 (frontend) and 8000 (backend) are free.
- **Docker issues:** Try `docker-compose down -v` to reset volumes, or rebuild with `--build`.
- **Microphone not working:** Ensure you have granted microphone permissions to the website in your browser settings.
- **CORS errors:** Ensure `CORS_ORIGINS` in your backend `.env` file includes your frontend URL.

---

## 🤝 Contributing
1. Fork the repo
2. Create a feature branch
3. Commit and push
4. Open a Pull Request

---

## 📄 License
MIT

---

**Happy chatting from the Latent team! 🤖💬**