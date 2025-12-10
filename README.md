# 🚀 Πυθία — Greek Army RAG System  
### *Retrieval-Augmented Generation Platform for Military Regulations*  

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

%%{init: {'theme':'dark'}}%%
---
flowchart TB

    APEX[APEX (Oracle)\napex_user_id / profile]
    FRONTEND[Next.js 16\nAuth UI / Chat UI\nSSE / WebSocket]

    API[FastAPI Backend\nHybrid Auth + Sessions\nRAG Orchestrator]

    PSQL[(PostgreSQL)\nUsers / Sessions\nConversations / Messages]
    WEAV[(Weaviate Vector DB)\nEmbeddings / Semantic Search]
    LLM[(LLM Provider\nOllama / Llama3)]

    APEX --> API
    FRONTEND <--> API

    API --> PSQL
    API --> WEAV
    WEAV --> LLM
    API --> LLM




---

# 🧬 Core Features

### 🔐 Hybrid Authentication  
- **Local Login** (email + password)  
- **APEX Login** (no password)  
- Automatic creation of **local mirror user** for every APEX login  
- Refresh token rotation  
- Sessions stored securely in PostgreSQL  

### 🔍 RAG Pipeline  
- PDF / Markdown ingestion  
- Intelligent chunking  
- Embedding generation  
- Weaviate vector search  
- Reranker  
- LLM reasoning  
- Context-aware answers with citations  

### 💬 Chat with history  
- Conversations per user  
- Messages stored with roles (user/assistant/system)

### 🐳 Full Docker Environment  
- Backend API  
- Frontend (Next.js)  
- PostgreSQL  
- Weaviate  

---

# 🧱 Backend Structure

backend/
├── app/
│ ├── api/
│ │ └── routes/
│ │ ├── auth.py
│ │ ├── query.py
│ │ ├── upload.py
│ │ └── health.py
│ ├── core/
│ │ ├── config.py
│ │ ├── security.py
│ │ └── middleware.py
│ ├── services/
│ │ ├── auth.py
│ │ ├── rag_service.py
│ │ ├── embeddings.py
│ │ └── vectordb.py
│ ├── models/
│ │ ├── user.py
│ │ ├── session.py
│ │ ├── conversation.py
│ │ └── message.py
│ ├── schemas/
│ │ ├── auth.py
│ │ ├── user.py
│ │ ├── query.py
│ │ └── rag.py
│ ├── db/
│ │ ├── engine.py
│ │ ├── session.py
│ │ └── migrations/
│ └── main.py
└── Dockerfile


# 🗄️ Database Schema

## **Users Table**

id UUID PK
email CITEXT NULL
password_hash TEXT NULL
apex_user_id TEXT UNIQUE NULL
full_name TEXT
role TEXT DEFAULT 'user'
created_at TIMESTAMP
updated_at TIMESTAMP

markdown
Copy code

## **Sessions Table**
id UUID PK
user_id UUID FK
refresh_token TEXT UNIQUE
user_agent TEXT
ip_address TEXT
expires_at TIMESTAMP

yaml
Copy code

## **Conversations & Messages**
Chat history storage.

---

# 🔐 Authentication Flows

## **Local Login**
POST /auth/login
username=email
password=***

markdown
Copy code

## **APEX Login**
POST /auth/apex-login
{
"apex_user_id": "...',
"email": "soldier@army.gr",
"full_name": "ΠΑΠΑΔΟΠΟΥΛΟΣ ΙΩΑΝΝΗΣ"
}

yaml
Copy code

✔ Αν δεν υπάρχει χρήστης → δημιουργείται local mirror  
✔ Αν υπάρχει → ενημερώνεται το profile  

---

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

---

# 🖥️ Frontend (Next.js 16)

- Server Actions  
- Secure token handling  
- Login + APEX login  
- Chat UI with streaming  
- Tailwind + Radix UI + ShadCN  
- Conversation history  

---

# ⚙️ Quick Start

## Start with Docker

```bash
docker-compose up -d







