# Ερμής (Hermes) - Greek Army RAG System

<div align="center">

![Ερμής](code/public/icon.svg)

**Retrieval-Augmented Generation System for Greek Military Regulations**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-Internal-red.svg)](LICENSE)

</div>

---

## 📖 Overview

**Ερμής (Hermes)** is an advanced RAG (Retrieval-Augmented Generation) system designed specifically for the Hellenic Armed Forces. It enables military personnel to query complex military regulations, procedures, and documentation using natural language in Greek.

### Key Features

- 🇬🇷 **Greek Language Optimized** - Built for Greek military terminology
- 🔍 **Semantic Search** - Vector-based document retrieval using Weaviate
- 🤖 **AI-Powered Responses** - LLM integration via Ollama
- 💬 **Real-time Streaming** - WebSocket support for live responses
- 🔐 **Secure Authentication** - JWT-based auth system
- 📄 **Multi-format Support** - PDF and Markdown document ingestion
- 🎨 **Modern UI** - Beautiful Next.js interface with dark mode
- 🐳 **Docker Ready** - Full containerization support

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Ερμής RAG System                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Frontend   │◄───────►│   Backend    │                 │
│  │   Next.js    │  REST/  │   FastAPI    │                 │
│  │              │  WebSoc │              │                 │
│  └──────────────┘         └──────┬───────┘                 │
│                                   │                          │
│                          ┌────────┴────────┐                │
│                          │                 │                │
│                    ┌─────▼─────┐    ┌─────▼─────┐          │
│                    │  Weaviate │    │  Ollama   │          │
│                    │  Vector   │    │   LLM     │          │
│                    │    DB     │    │           │          │
│                    └───────────┘    └───────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Backend
- **FastAPI** - High-performance Python web framework
- **LangChain** - LLM application framework
- **Weaviate** - Vector database for semantic search
- **Ollama** - Local LLM inference engine
- **JWT** - Secure authentication

#### Frontend
- **Next.js 16** - React framework with SSR
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

- **Docker & Docker Compose** (recommended)
- **Python 3.10+** (for local development)
- **Node.js 20+** (for frontend development)
- **Ollama** - [Install from ollama.ai](https://ollama.ai)

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd ErmisApp

# 2. Install Ollama models (one-time setup)
ollama pull llama3.2
ollama pull nomic-embed-text

# 3. Start all services
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/api/docs
```

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env.example .env

# Start Weaviate (Docker)
docker run -d \
  -p 8080:8080 \
  -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
  semitechnologies/weaviate:latest

# Ingest documents (optional)
python scripts/ingest.py

# Start backend server
./scripts/start.sh
# Or: python -m uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup

```bash
cd code

# Install dependencies
npm install
# Or: pnpm install

# Copy environment file
cp .env.local.example .env.local

# Start development server
npm run dev
```

---

## 📚 Documentation

### Project Structure

```
ErmisApp/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   └── routes/
│   │   │       ├── auth.py    # Authentication
│   │   │       ├── query.py   # RAG queries
│   │   │       ├── health.py  # Health checks
│   │   │       └── upload.py  # Document upload
│   │   ├── core/              # Core functionality
│   │   │   ├── config.py      # Settings
│   │   │   └── security.py    # Auth utilities
│   │   ├── models/            # Pydantic models
│   │   │   ├── auth.py
│   │   │   └── query.py
│   │   ├── services/          # Business logic
│   │   │   ├── rag_service.py # RAG orchestration
│   │   │   ├── embeddings.py  # Embedding generation
│   │   │   ├── llm_providers.py
│   │   │   ├── vectordb.py    # Weaviate client
│   │   │   ├── loaders.py     # Document loaders
│   │   │   ├── splitter.py    # Text chunking
│   │   │   └── utils.py
│   │   └── main.py            # FastAPI app
│   ├── config/
│   │   └── config.yml         # RAG configuration
│   ├── data/
│   │   └── corpus/            # Document storage
│   ├── scripts/
│   │   ├── setup.sh           # Setup script
│   │   ├── start.sh           # Start script
│   │   └── ingest.py          # Document ingestion
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── code/                      # Next.js Frontend
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── login/            # Login page
│   │   ├── signup/           # Signup page
│   │   ├── page.tsx          # Main chat interface
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── logo.tsx
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   ├── api-client.ts     # Backend API client
│   │   └── utils.ts
│   ├── public/               # Static assets
│   ├── Dockerfile.frontend
│   ├── next.config.mjs
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml         # Docker orchestration
└── README.md                  # This file
```

### Configuration

#### Backend Configuration

Edit `backend/config/config.yml`:

```yaml
corpus:
  input_dir: "backend/data/corpus"
  file_types: [".pdf", ".md"]

embeddings:
  provider: "ollama"
  model: "nomic-embed-text"
  batch_size: 16

vector_db:
  backend: "weaviate"
  top_k: 6
  weaviate:
    url: "http://localhost:8080"
    class_name: "GreekMilitaryDocs"

llm:
  provider: "ollama"
  model: "llama3.2"
  temperature: 0.1
```

#### Environment Variables

**Backend** (`backend/.env`):
```bash
HOST=0.0.0.0
PORT=8000
SECRET_KEY=change-this-in-production
WEAVIATE_URL=http://localhost:8080
OLLAMA_BASE_URL=http://localhost:11434
```

**Frontend** (`code/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## 📖 Usage Guide

### 1. Document Ingestion

Add your military regulation documents to `backend/data/corpus/`:

```bash
backend/data/corpus/
├── regulation-1.pdf
├── regulation-2.md
└── manual-3.pdf
```

Run ingestion:
```bash
cd backend
python scripts/ingest.py
```

### 2. User Authentication

**Default Credentials:**
- Username: `admin`
- Password: `1234`

⚠️ **Change these in production!**

### 3. Querying the System

#### Via Web Interface
1. Navigate to http://localhost:3000
2. Login with credentials
3. Type your question in Greek
4. Receive AI-powered answers with sources

#### Via API

**Non-streaming query:**
```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Ποιες είναι οι διαδικασίες για άδεια;"}'
```

**Authentication:**
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=1234"

# Use token
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <your-token>"
```

---

## 🔧 Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd code
npm test
```

### Code Quality

```bash
# Backend
cd backend
black app/
flake8 app/
mypy app/

# Frontend
cd code
npm run lint
npm run type-check
```

### Hot Reload Development

Both backend and frontend support hot reload in development mode:

```bash
# Backend (automatic with --reload flag)
cd backend
python -m uvicorn app.main:app --reload

# Frontend (automatic with npm run dev)
cd code
npm run dev
```

---

## 🐳 Docker Deployment

### Build Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Production Deployment

```bash
# Start in production mode
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

### Environment-specific Configs

Create `docker-compose.prod.yml` for production overrides:

```yaml
version: '3.8'

services:
  backend:
    environment:
      - DEBUG=False
      - SECRET_KEY=${SECRET_KEY}
    restart: always

  frontend:
    environment:
      - NODE_ENV=production
    restart: always
```

---

## 🔒 Security Considerations

### Production Checklist

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Use HTTPS for all connections
- [ ] Enable CORS only for trusted origins
- [ ] Implement rate limiting on API endpoints
- [ ] Use proper database instead of in-memory storage
- [ ] Enable authentication on all endpoints
- [ ] Set up firewall rules
- [ ] Regular security audits
- [ ] Keep dependencies updated

### Recommended Security Headers

```python
# In backend/app/main.py
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["yourdomain.mil.gr"]
)
```

---

## 🐛 Troubleshooting

### Common Issues

#### Weaviate Connection Failed
```bash
# Check if Weaviate is running
curl http://localhost:8080/v1/meta

# Restart Weaviate
docker restart <weaviate-container>
```

#### Ollama Not Found
```bash
# Check Ollama status
ollama list

# Pull required models
ollama pull llama3.2
ollama pull nomic-embed-text
```

#### Frontend Can't Connect to Backend
```bash
# Check backend is running
curl http://localhost:8000/api/health

# Verify environment variables
cat code/.env.local
```

#### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

---

## 📊 Performance Optimization

### Backend Optimization

1. **Enable response caching**
2. **Use connection pooling for Weaviate**
3. **Implement batch processing for embeddings**
4. **Add Redis for session management**

### Frontend Optimization

1. **Enable Next.js image optimization**
2. **Implement route prefetching**
3. **Use React.memo for expensive components**
4. **Add service worker for offline support**

---

## 🤝 Contributing

This is an internal military system. All contributions must follow:

1. Security clearance requirements
2. Code review process
3. Testing requirements
4. Documentation standards

---

## 📄 License

**Internal Use Only** - Hellenic Armed Forces

This system is classified for internal military use. Unauthorized access, use, or distribution is strictly prohibited.

---

## 👥 Support

For technical support:
- **Internal Helpdesk**: [IT Support Portal]
- **Documentation**: See `/docs` directory
- **Training**: Contact your unit IT officer

---

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Basic RAG system
- [x] Authentication
- [x] Document ingestion
- [x] Web interface

### Phase 2 (Planned)
- [ ] Multi-user support with roles
- [ ] Document version control
- [ ] Advanced search filters
- [ ] Export functionality
- [ ] Audit logging

### Phase 3 (Future)
- [ ] Multi-modal support (images, diagrams)
- [ ] Mobile application
- [ ] Voice interface
- [ ] Integration with existing systems
- [ ] Advanced analytics dashboard

---

<div align="center">

**Made with 🇬🇷 for the Hellenic Armed Forces**

*Ερμής - Connecting knowledge across the forces*

</div>

