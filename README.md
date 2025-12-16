# Πυθία (Pithia) - Greek Army RAG System

<div align="center">

![Pythia Logo](code/public/ketak-sima.png)

**"ΔΟΣ ΜΟΙ ΠΑ ΣΤΩ ΚΑΙ ΤΑΝ ΓΑΝ ΚΙΝΑΣΩ" — Archimedes**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/Postgres-16-blue.svg)](https://www.postgresql.org/)
[![Weaviate](https://img.shields.io/badge/Weaviate-VectorDB-orange.svg)](https://weaviate.io/)

---

</div>

# 📖 Overview

**Πυθία** είναι ένα σύγχρονο AI σύστημα αναζήτησης για το Ελληνικό Στρατό.  
Επιτρέπει στο προσωπικό να αναζητά στρατιωτικούς κανονισμούς, διαδικασίες και έγγραφα μέσω φυσικής γλώσσας.

Βασίζεται σε **RAG (Retrieval-Augmented Generation)**, συνδυάζοντας:

- 🧭 **Semantic Search** (Weaviate Vector DB)  
- 🧠 **LLM Reasoning** (Ollama / Llama 3.2)  
- 🔐 **Hybrid Authentication** (APEX + Local Password)  
- ⚡ **FastAPI + Next.js** για υψηλή απόδοση  
- 📚 **PDF & Markdown ingestion** με embeddings

```mermaid

flowchart TB
    APEX["APEX (Oracle)
apex_user_id / profile"]

    FRONTEND["Next.js 16
Auth UI / Chat UI
SSE / WebSocket"]

    API["FastAPI Backend
Hybrid Auth + Sessions
RAG Orchestrator"]

    PSQL[("PostgreSQL
Users / Sessions
Conversations / Messages")]

    WEAV[("Weaviate Vector DB
Embeddings / Semantic Search")]

    LLM[("LLM Provider
Ollama / Llama3")]

    APEX --> API
    FRONTEND <--> API

    API --> PSQL
    API --> WEAV
    WEAV --> LLM
    API --> LLM
```

# 🧬 Core Features

### 🔐 Hybrid Authentication
- Local Login (email + password)  
- APEX Login (no password)  
- Αυτόματη δημιουργία local mirror user για κάθε APEX login  
- Refresh token rotation & sessions σε PostgreSQL  

### 🔍 RAG Pipeline
- PDF / Markdown ingestion  
- Intelligent chunking  
- Embedding generation  
- Weaviate vector search  
- Reranker  
- LLM reasoning  
- Context-aware answers με citations  

### 💬 Chat with history
- Conversations per user  
- Messages stored with roles (user/assistant/system)  

### 🐳 Full Docker Environment
- Backend API  
- Frontend (Next.js)  
- PostgreSQL  
- Weaviate  

# 🧱 Backend Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── query.py
│   │       ├── upload.py
│   │       └── health.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── middleware.py
│   ├── services/
│   │   ├── auth.py
│   │   ├── rag_service.py
│   │   ├── embeddings.py
│   │   └── vectordb.py
│   ├── models/
│   │   ├── user.py
│   │   ├── session.py
│   │   ├── conversation.py
│   │   └── message.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── query.py
│   │   └── rag.py
│   ├── db/
│   │   ├── engine.py
│   │   ├── session.py
│   │   └── migrations/
│   └── main.py
└── Dockerfile
```

# 🗄️ Database Schema

**Users**
```
id UUID PK
email CITEXT NULL
password_hash TEXT NULL
apex_user_id TEXT UNIQUE NULL
full_name TEXT
role TEXT DEFAULT 'user'
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Sessions**
```
id UUID PK
user_id UUID FK
refresh_token TEXT UNIQUE
user_agent TEXT
ip_address TEXT
expires_at TIMESTAMP
```

**Conversations & Messages**
- Chat history storage.

# 🔐 Authentication Flows

```mermaid
sequenceDiagram
    autonumber

    participant FE as Frontend (Next.js)
    participant API as FastAPI Backend
    participant AUTH as AuthService
    participant DB as PostgreSQL (Users/Sessions)
    participant APEX as APEX (Oracle)

    Note over FE: User initiates Login

    FE->>API: POST /auth/login (email + password)
    API->>AUTH: authenticate_local()
    AUTH->>DB: query users by email
    DB-->>AUTH: user with password_hash
    AUTH-->>API: user or fail

    alt Local login success
        API->>AUTH: create_session(user)
        AUTH->>DB: INSERT session (refresh_token)
        DB-->>AUTH: OK
        AUTH-->>API: access_token + refresh_token
        API-->>FE: Auth success
    else Wrong password / missing user
        API-->>FE: 401 Unauthorized
    end

    Note over FE,API: APEX Path (no password)

    FE->>API: POST /auth/apex-login (apex_user_id, email, full_name)
    API->>AUTH: authenticate_apex()

    AUTH->>DB: find user by apex_user_id
    DB-->>AUTH: user OR null

    alt User exists
        AUTH->>DB: UPDATE email/full_name (sync with APEX)
        DB-->>AUTH: OK
    else First-time APEX user
        AUTH->>DB: INSERT new user (no password_hash)
        DB-->>AUTH: OK
    end

    API->>AUTH: create_session(user)
    AUTH->>DB: INSERT session with refresh_token
    DB-->>AUTH: OK

    AUTH-->>API: access_token + refresh_token
    API-->>FE: Auth success

```


## Local Login
`POST /auth/login`

Form fields:
- `username=email`
- `password=***`

## APEX Login
`POST /auth/apex-login`

```json
{
  "apex_user_id": "...",
  "email": "soldier@army.gr",
  "full_name": "ΠΑΠΑΔΟΠΟΥΛΟΣ ΙΩΑΝΝΗΣ"
}
```

✔ Αν δεν υπάρχει χρήστης → δημιουργείται local mirror  
✔ Αν υπάρχει → ενημερώνεται το profile  

# 🧮 RAG Pipeline Flow

1. Load PDF / Markdown  
2. Split into chunks  
3. Generate embeddings  
4. Upsert in Weaviate  
5. Query embedding  
6. Semantic search  
7. Reranking  
8. LLM reasoning  
9. Final answer with citations  

# 🖥️ Frontend (Next.js 16)

- Server Actions  
- Secure token handling  
- Login + APEX login  
- Chat UI with streaming (SSE / WebSocket)  
- Tailwind + Radix UI + ShadCN  
- Conversation history  

# ⚙️ Quick Start

## Start with Docker

```bash
docker-compose up -d
```

Frontend: http://localhost:3000  
Backend:  http://localhost:8000  
Docs:     http://localhost:8000/api/docs  

## Local Dev (manual)

Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

Frontend
```bash
cd code
npm install
cp .env.local.example .env.local
npm run dev
```

# 🐛 Troubleshooting Steps for Root Cause Analysis

- **flash_attn warning**: optional; install `flash-attn` if you want faster attention on supported GPUs.
- **Weaviate unreachable**: check `WEAVIATE_URL` and container status.
- **Ollama model missing**: `ollama pull jobautomation/OpenEuroLLM-Greek:latest` (or the configured model).



