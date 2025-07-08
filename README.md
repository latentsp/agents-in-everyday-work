# LLM Chat Interface Demo

A full-stack chat application featuring a Python FastAPI backend (with Gemini API integration) and a Next.js frontend with real-time streaming.

---

## 🚀 Features
- **Real-time Streaming**: Messages stream live using Server-Sent Events
- **Conversation History**: Maintains context throughout the chat
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Robust Error Handling**: Retry logic and user-friendly errors
- **TypeScript**: End-to-end type safety
- **Markdown Support**: Rich text with syntax highlighting
- **Configurable AI**: Adjustable temperature, model, and token limits
- **Connection Monitoring**: Real-time status and auto-reconnect
- **Rate Limiting**: Prevents abuse
- **Docker Support**: One-command setup
- **Accessibility**: ARIA labels, keyboard navigation

---

## 🏗️ Architecture

```
llm-chat-demo/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # Pydantic models
│   │   ├── services/       # Gemini API logic
│   │   ├── routes/         # API endpoints
│   │   └── main.py         # FastAPI app
│   ├── pyproject.toml      # Python deps (uv/poetry style)
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
**Backend:** FastAPI, Google Generative AI SDK, Pydantic, Uvicorn, SlowAPI, python-dotenv

**Frontend:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, React Hot Toast, React Markdown, Lucide React

---

## 📋 Prerequisites
- Python 3.8+
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
   ```bash
   export GEMINI_API_KEY=your_gemini_api_key_here
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
#### Backend
1. **Setup venv**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. **Install dependencies**
   ```bash
   pip install -r requirements.txt  # Or use 'uv pip install --requirements requirements.txt' if using uv
   ```
3. **Set environment variables**
   - Create a `.env` file in `backend/` with:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     PORT=8000
     HOST=0.0.0.0
     DEBUG=true
     CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
     RATE_LIMIT_PER_MINUTE=60
     LOG_LEVEL=INFO
     ```
4. **Run the backend**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

#### Frontend
1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```
2. **Configure environment**
   - Copy and edit:
     ```bash
     cp env.local.example .env.local
     # (Edit .env.local if needed)
     ```
3. **Run the frontend**
   ```bash
   npm run dev
   ```

---

## 🔧 Configuration

### Backend (`.env`)
- `GEMINI_API_KEY` (required)
- `PORT` (default: 8000)
- `HOST` (default: 0.0.0.0)
- `DEBUG` (default: true)
- `CORS_ORIGINS` (default: http://localhost:3000,http://127.0.0.1:3000)
- `RATE_LIMIT_PER_MINUTE` (default: 60)
- `LOG_LEVEL` (default: INFO)

### Frontend (`.env.local`)
- `NEXT_PUBLIC_API_URL` (default: http://localhost:8000/api/v1)
- `NEXT_PUBLIC_APP_NAME` (default: LLM Chat Demo)
- `NEXT_PUBLIC_APP_VERSION` (default: 1.0.0)

---

## 📡 API Endpoints
- `GET /health` — Basic health check
- `GET /api/v1/health` — Health + Gemini status
- `GET /api/v1/models` — List available models
- `POST /api/v1/chat` — Send message (non-streaming)
- `POST /api/v1/chat/test` — Test endpoint

**Sample request:**
```json
{
  "message": "Hello, how are you?",
  "conversation_history": [
    { "role": "user", "content": "Previous message", "timestamp": "2024-01-01T12:00:00Z" }
  ],
  "model": "gemini-flash",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

---

## 🎨 UI Features
- **Streaming chat** with typing indicators
- **Markdown** with syntax highlighting
- **Timestamps** and retry
- **Auto-scroll**
- **Keyboard shortcuts** (Enter to send, Shift+Enter for newline)
- **Config panel**: Model, temperature, tokens, streaming toggle
- **Error handling**: Connection, rate limit, network, graceful fallback


---

## 📦 Development
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
- Set `DEBUG=false` in production
- Use proper CORS origins
- Configure rate limiting
- Set up monitoring/logging
- Use HTTPS
- Consider a reverse proxy (nginx)

---

## 🛠️ Troubleshooting
- **Gemini API key errors:** Ensure your key is valid and has quota ([get one here](https://makersuite.google.com/app/apikey)).
- **Port conflicts:** Make sure ports 3000 (frontend) and 8000 (backend) are free.
- **Docker issues:** Try `docker-compose down -v` to reset volumes, or rebuild with `--build`.
- **.env not loaded:** Double-check your `.env` files and variable names.
- **CORS errors:** Ensure `CORS_ORIGINS` includes your frontend URL.
- **API not responding:** Check logs (`docker-compose logs -f`) and ensure both services are healthy.

---

## 🤝 Contributing
1. Fork the repo
2. Create a feature branch
3. Commit and push
4. Open a Pull Request

---

## 📄 License
MIT — see [LICENSE](LICENSE)

---

## 🙏 Acknowledgments
- [Google AI Studio](https://makersuite.google.com/) (Gemini API)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 📞 Support
- Check [Issues](../../issues)
- Review API docs at http://localhost:8000/docs
- Ensure your Gemini API key is valid

---

**Happy chatting! 🤖💬**