# Ερμής System Architecture

## 📐 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Ερμής RAG System                           │
│                   Greek Army Document Intelligence                  │
└─────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │   User (Browser)    │
                    └──────────┬──────────┘
                               │
                               │ HTTPS / WSS
                               │
        ┌──────────────────────┴────────────────────────┐
        │                                                │
        │         Frontend Layer (Next.js 16)           │
        │  ┌──────────────────────────────────────┐    │
        │  │  • React Components                  │    │
        │  │  • TypeScript                        │    │
        │  │  • Tailwind CSS                      │    │
        │  │  • WebSocket Client                  │    │
        │  │  • State Management                  │    │
        │  └──────────────────────────────────────┘    │
        │                                                │
        └──────────────────────┬────────────────────────┘
                               │
                               │ REST API / WebSocket
                               │
        ┌──────────────────────┴────────────────────────┐
        │                                                │
        │        Backend Layer (FastAPI)                │
        │  ┌──────────────────────────────────────┐    │
        │  │  API Routes:                         │    │
        │  │  • /api/auth/*    - Authentication   │    │
        │  │  • /api/query     - RAG Queries      │    │
        │  │  • /api/ws/chat   - Streaming Chat   │    │
        │  │  • /api/upload    - Document Upload  │    │
        │  │  • /api/health    - Health Check     │    │
        │  └──────────────────────────────────────┘    │
        │                                                │
        │  ┌──────────────────────────────────────┐    │
        │  │  Middleware:                         │    │
        │  │  • CORS                              │    │
        │  │  • Security Headers                  │    │
        │  │  • Rate Limiting                     │    │
        │  │  • Request Logging                   │    │
        │  │  • Authentication                    │    │
        │  └──────────────────────────────────────┘    │
        │                                                │
        │  ┌──────────────────────────────────────┐    │
        │  │  Services:                           │    │
        │  │  • RAG Service (Orchestration)       │    │
        │  │  • Embedding Factory                 │    │
        │  │  • LLM Providers                     │    │
        │  │  • Vector DB Client                  │    │
        │  │  • Document Loaders                  │    │
        │  │  • Text Splitter                     │    │
        │  └──────────────────────────────────────┘    │
        │                                                │
        └─────────┬──────────────────┬───────────────────┘
                  │                  │
                  │                  │
         ┌────────▼────────┐  ┌─────▼────────┐
         │                 │  │              │
         │   Weaviate      │  │   Ollama     │
         │   Vector DB     │  │   LLM        │
         │                 │  │              │
         │  • Embeddings   │  │  • llama3.2  │
         │  • Similarity   │  │  • nomic-    │
         │    Search       │  │    embed     │
         │  • Collections  │  │              │
         │                 │  │              │
         └─────────────────┘  └──────────────┘
```

## 🔄 Data Flow

### Query Processing Flow

```
1. User Input
   └─> Frontend validates input
       └─> WebSocket/HTTP request to backend
           └─> Backend authentication
               └─> RAG Service processes query
                   │
                   ├─> Generate query embedding (Ollama)
                   │   └─> Search vector DB (Weaviate)
                   │       └─> Retrieve relevant chunks
                   │
                   └─> Build context with retrieved chunks
                       └─> Send to LLM (Ollama)
                           └─> Stream/Return response
                               └─> Backend sends to frontend
                                   └─> Display to user
```

### Document Ingestion Flow

```
1. Document Upload
   └─> Save to corpus directory
       └─> Ingestion script triggered
           └─> Load document (PDF/MD)
               └─> Split into chunks
                   └─> Generate embeddings
                       └─> Store in Weaviate
                           └─> Index ready for queries
```

## 🏗️ Component Architecture

### Backend Components

```
backend/
├── app/
│   ├── main.py                    # Application entry point
│   │   • FastAPI app initialization
│   │   • Middleware configuration
│   │   • Route registration
│   │   • Startup/shutdown events
│   │
│   ├── api/                       # API Layer
│   │   └── routes/
│   │       ├── auth.py           # Authentication endpoints
│   │       │   • POST /signup
│   │       │   • POST /login
│   │       │   • GET  /me
│   │       │   • POST /logout
│   │       │
│   │       ├── query.py          # Query endpoints
│   │       │   • POST /query           (non-streaming)
│   │       │   • WS   /ws/chat         (streaming)
│   │       │
│   │       ├── health.py         # Health checks
│   │       │   • GET  /health
│   │       │   • GET  /status
│   │       │
│   │       └── upload.py         # Document upload
│   │           • POST /upload
│   │
│   ├── core/                      # Core Functionality
│   │   ├── config.py             # Configuration management
│   │   │   • Settings class
│   │   │   • Environment variables
│   │   │
│   │   ├── security.py           # Security utilities
│   │   │   • Password hashing
│   │   │   • JWT creation/validation
│   │   │   • Token management
│   │   │
│   │   └── middleware.py         # Custom middleware
│   │       • Rate limiting
│   │       • Security headers
│   │       • Request logging
│   │
│   ├── models/                    # Data Models
│   │   ├── auth.py               # Auth models
│   │   │   • Token
│   │   │   • UserCreate
│   │   │   • User
│   │   │
│   │   └── query.py              # Query models
│   │       • QueryRequest
│   │       • QueryResponse
│   │       • SourceInfo
│   │
│   └── services/                  # Business Logic
│       ├── rag_service.py        # RAG orchestration
│       │   • Document ingestion
│       │   • Query processing
│       │   • Response streaming
│       │
│       ├── embeddings.py         # Embedding generation
│       │   • Ollama integration
│       │   • Batch processing
│       │
│       ├── llm_providers.py      # LLM integration
│       │   • Model management
│       │   • Streaming support
│       │
│       ├── vectordb.py           # Vector database
│       │   • Weaviate client
│       │   • Similarity search
│       │
│       ├── loaders.py            # Document loading
│       │   • PDF loader
│       │   • Markdown loader
│       │
│       ├── splitter.py           # Text chunking
│       │   • Greek-aware splitting
│       │   • Section detection
│       │
│       └── utils.py              # Utilities
│           • Config loading
│           • File iteration
```

### Frontend Components

```
code/
├── app/
│   ├── page.tsx                   # Main chat interface
│   │   • Conversation management
│   │   • WebSocket handling
│   │   • Message display
│   │   • Real-time updates
│   │
│   ├── login/
│   │   └── page.tsx              # Login page
│   │
│   ├── signup/
│   │   └── page.tsx              # Registration page
│   │
│   └── api/
│       └── chat/
│           └── route.ts          # Edge API routes
│
├── components/
│   ├── ui/                        # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── sidebar.tsx
│   │   └── ...
│   │
│   ├── logo.tsx                  # Application logo
│   └── theme-provider.tsx        # Dark mode support
│
└── lib/
    ├── api-client.ts             # Backend API client
    │   • Authentication
    │   • Query methods
    │   • WebSocket factory
    │
    └── utils.ts                  # Utility functions
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────┐
│                Security Layers                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Network Layer                                   │
│     • Firewall                                      │
│     • VPN (optional)                                │
│     • Internal network only                         │
│                                                     │
│  2. Transport Layer                                 │
│     • HTTPS/TLS 1.3                                 │
│     • WSS (WebSocket Secure)                        │
│     • Certificate validation                        │
│                                                     │
│  3. Application Layer                               │
│     • JWT authentication                            │
│     • Password hashing (bcrypt)                     │
│     • CORS policies                                 │
│     • Rate limiting                                 │
│     • Security headers                              │
│                                                     │
│  4. Data Layer                                      │
│     • Encrypted at rest                             │
│     • Access controls                               │
│     • Audit logging                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 📊 Scalability Considerations

### Horizontal Scaling

```
            Load Balancer
                 │
    ┌────────────┼────────────┐
    │            │            │
Backend 1    Backend 2    Backend 3
    │            │            │
    └────────────┼────────────┘
                 │
         ┌───────┴───────┐
         │               │
    Weaviate         Ollama
    (Clustered)      (Pool)
```

### Vertical Scaling

- **Backend**: Increase CPU/RAM for FastAPI workers
- **Weaviate**: Increase memory for index storage
- **Ollama**: GPU allocation for faster inference

### Caching Strategy

```
Request → Cache Check → Hit? → Return cached
              │
              No
              │
          Process → Cache → Return
```

Implement with Redis:
- Query result caching
- Session storage
- Rate limit counters

## 🔄 State Management

### Backend State

- **Stateless API** - Each request is independent
- **Shared state** via:
  - Weaviate (document vectors)
  - Database (users, sessions - future)
  - Cache (Redis - future)

### Frontend State

- **Local state** - React useState/useRef
- **Server state** - API responses
- **Client storage** - localStorage for auth tokens

## 🎯 Performance Optimization

### Backend Optimizations

1. **Connection Pooling**
   - Weaviate client connection pool
   - HTTP client connection reuse

2. **Async Processing**
   - FastAPI async/await
   - Concurrent document processing
   - Streaming responses

3. **Caching**
   - Embedding cache
   - Query result cache
   - Static file caching

### Frontend Optimizations

1. **Code Splitting**
   - Route-based splitting
   - Component lazy loading

2. **Asset Optimization**
   - Image optimization
   - Font subsetting
   - CSS purging

3. **Rendering**
   - Server-side rendering (SSR)
   - Static generation where possible
   - Client-side hydration

## 📈 Monitoring Architecture

```
┌─────────────────────────────────────────┐
│         Monitoring Stack                │
├─────────────────────────────────────────┤
│                                         │
│  Application Metrics                    │
│  ├─ FastAPI metrics                     │
│  ├─ Response times                      │
│  ├─ Error rates                         │
│  └─ Request volumes                     │
│                                         │
│  Infrastructure Metrics                 │
│  ├─ CPU usage                           │
│  ├─ Memory usage                        │
│  ├─ Disk I/O                            │
│  └─ Network traffic                     │
│                                         │
│  Service Health                         │
│  ├─ Weaviate status                     │
│  ├─ Ollama availability                 │
│  └─ Database connections                │
│                                         │
│  Business Metrics                       │
│  ├─ Queries per user                    │
│  ├─ Average response quality            │
│  ├─ Document coverage                   │
│  └─ User satisfaction                   │
│                                         │
└─────────────────────────────────────────┘
```

## 🔍 Logging Strategy

```
Application Logs
├── Access logs
│   • Request/response details
│   • User actions
│   • Performance metrics
│
├── Error logs
│   • Exceptions
│   • Stack traces
│   • Context information
│
├── Audit logs
│   • Authentication events
│   • Data access
│   • Configuration changes
│
└── Debug logs
    • Development debugging
    • Troubleshooting
    • Performance profiling
```

## 🚀 Deployment Architecture

### Development

```
Developer Machine
├── Backend (localhost:8000)
├── Frontend (localhost:3000)
├── Weaviate (localhost:8080)
└── Ollama (localhost:11434)
```

### Staging/Production

```
Load Balancer (HTTPS)
    │
    ├─> Frontend Cluster
    │   └─> Next.js (SSR)
    │
    └─> Backend Cluster
        ├─> FastAPI Instances
        ├─> Weaviate Cluster
        └─> Ollama Pool
```

## 📦 Technology Decisions

### Why FastAPI?
- High performance (async)
- Automatic API documentation
- Type safety with Pydantic
- WebSocket support
- Python ecosystem

### Why Next.js?
- Server-side rendering
- Excellent performance
- TypeScript support
- Rich ecosystem
- Production-ready

### Why Weaviate?
- Native vector operations
- Scalable
- GraphQL support
- Cloud-native
- Open source

### Why Ollama?
- Local deployment
- Privacy-focused
- Easy model management
- No API costs
- Military compliance

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-12  
**Maintained By**: IT Division, Hellenic Armed Forces

