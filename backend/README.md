# Ερμής (Hermes) - Backend API

FastAPI backend for the Greek Army RAG (Retrieval-Augmented Generation) system.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)

## ✨ Features

- 🚀 FastAPI-based REST API
- 🔐 JWT authentication
- 💬 WebSocket support for streaming responses
- 📚 RAG system with Weaviate vector database
- 🤖 Integration with Ollama for LLM and embeddings
- 📄 Document ingestion (PDF, Markdown)
- 🎯 Greek language optimized

## 🏗️ Architecture

```
Backend Architecture:
┌─────────────────┐
│   FastAPI App   │
├─────────────────┤
│  Auth Routes    │
│  Query Routes   │
│  Upload Routes  │
├─────────────────┤
│  RAG Service    │
├─────────────────┤
│  Embeddings     │◄──► Ollama
│  Vector DB      │◄──► Weaviate
│  LLM Provider   │◄──► Ollama
└─────────────────┘
```

## 📦 Prerequisites

### Required Services

1. **Python 3.10+**
2. **Ollama** - Local LLM inference
   ```bash
   # Install Ollama from https://ollama.ai
   # Pull required models:
   ollama pull llama3.2
   ollama pull nomic-embed-text
   ```

3. **Weaviate** - Vector database
   ```bash
   docker run -d \
     -p 8080:8080 \
     -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
     -e PERSISTENCE_DATA_PATH=/var/lib/weaviate \
     semitechnologies/weaviate:latest
   ```

## 🚀 Installation

### 1. Setup Script (Recommended)

```bash
cd backend
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Manual Installation

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp env.example .env

# Create necessary directories
mkdir -p data/corpus logs
```

## ⚙️ Configuration

### Environment Variables

Edit `.env` file:

```bash
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=False

# Security (CHANGE IN PRODUCTION!)
SECRET_KEY=your-secret-key-here

# Services
WEAVIATE_URL=http://localhost:8080
OLLAMA_BASE_URL=http://localhost:11434
```

### RAG Configuration

Edit `config/config.yml`:

```yaml
corpus:
  input_dir: "backend/data/corpus"
  file_types: [".pdf", ".md"]

embeddings:
  provider: "ollama"
  model: "nomic-embed-text"

llm:
  provider: "ollama"
  model: "llama3.2"
  temperature: 0.1
```

## 🏃 Running the Server

### Development Mode

```bash
# Using startup script
./scripts/start.sh

# Or manually
python -m uvicorn main:app --reload --port 8000
```

### Production Mode

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## 📄 Document Ingestion

### 1. Add Documents

Place your documents in `backend/data/corpus/`:
```bash
backend/data/corpus/
  ├── regulation-1.pdf
  ├── regulation-2.md
  └── ...
```

### 2. Run Ingestion

```bash
python scripts/ingest.py
```

This will:
- Load documents from corpus directory
- Split them into chunks
- Generate embeddings
- Store in Weaviate

## 🔌 API Documentation

### Authentication

#### Register
```bash
POST /api/auth/signup
{
  "username": "user",
  "password": "password",
  "full_name": "Full Name"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=admin&password=1234
```

Response:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "username": "admin",
    "full_name": "Διαχειριστής",
    "role": "admin"
  }
}
```

### Query Endpoints

#### Non-streaming Query
```bash
POST /api/query
{
  "question": "Ποιες είναι οι διαδικασίες για άδεια;"
}
```

Response:
```json
{
  "answer": "Σύμφωνα με τον κανονισμό...",
  "sources": [
    {
      "text": "...",
      "score": 0.95,
      "source": "regulation-1.pdf"
    }
  ]
}
```

#### WebSocket Streaming
```javascript
const ws = new WebSocket('ws://localhost:8000/api/ws/chat');

ws.send(JSON.stringify({
  question: "Πώς εφαρμόζονται οι κανονισμοί;"
}));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.type: "sources" | "token" | "done" | "error"
};
```

### Health Check
```bash
GET /api/health
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py         # Authentication endpoints
│   │       ├── query.py        # RAG query endpoints
│   │       ├── health.py       # Health checks
│   │       └── upload.py       # Document upload
│   ├── core/
│   │   ├── config.py           # Application settings
│   │   └── security.py         # JWT & password handling
│   ├── models/
│   │   ├── auth.py             # Auth models
│   │   └── query.py            # Query models
│   └── services/
│       ├── rag_service.py      # Main RAG orchestration
│       ├── embeddings.py       # Embedding generation
│       ├── llm_providers.py    # LLM integration
│       ├── vectordb.py         # Weaviate client
│       ├── loaders.py          # Document loaders
│       ├── splitter.py         # Text chunking
│       └── utils.py            # Utilities
├── config/
│   └── config.yml              # RAG configuration
├── data/
│   └── corpus/                 # Document storage
├── scripts/
│   ├── setup.sh                # Setup script
│   ├── start.sh                # Startup script
│   └── ingest.py               # Document ingestion
├── env.example                 # Environment template
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🔒 Security Notes

1. **Change SECRET_KEY** in production
2. Use **HTTPS** in production
3. Implement **rate limiting** for public deployments
4. Use **proper database** instead of in-memory user storage
5. Enable **CORS** only for trusted origins

## 🐛 Troubleshooting

### Weaviate Connection Error
```bash
# Check if Weaviate is running
curl http://localhost:8080/v1/meta

# Restart Weaviate
docker restart <weaviate-container-id>
```

### Ollama Connection Error
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama service
ollama serve
```

### Module Import Errors
```bash
# Ensure PYTHONPATH is set
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Reinstall dependencies
pip install -r requirements.txt
```

## 📝 Default Credentials

- **Username**: `admin`
- **Password**: `1234`

⚠️ Change these in production!

## 🤝 Contributing

This is an internal military system. Contributions should follow security protocols.

## 📄 License

Internal use only - Greek Armed Forces

---

Made with 🇬🇷 for the Hellenic Armed Forces

