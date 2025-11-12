# Ερμής - Greek Army RAG Chatbot

A beautiful, professional RAG (Retrieval-Augmented Generation) chatbot system for the Greek Armed Forces intranet, built with Next.js 16 and FastAPI.

## Features

- **Real-time Streaming**: WebSocket-based chat with live response streaming
- **Greek Language Support**: Fully localized interface and RAG system
- **Military-Grade Design**: Professional blue/white color scheme inspired by Greek flag
- **Source Attribution**: Shows which documents were used for each answer
- **Vector Search**: Powered by Weaviate for efficient document retrieval
- **Local LLM**: Uses Ollama for complete data privacy
- **Document Processing**: Supports PDF and Markdown with Greek military text splitting

## Architecture

\`\`\`
├── app/                      # Next.js 16 frontend
│   ├── page.tsx             # Main chat interface
│   └── api/                 # API routes
├── scripts/                  # Python backend
│   ├── app/                 # RAG modules
│   │   ├── rag_service.py   # Main orchestration
│   │   ├── vectordb.py      # Weaviate integration
│   │   ├── embeddings.py    # Ollama embeddings
│   │   ├── llm_providers.py # Chat models
│   │   ├── loaders.py       # Document loaders
│   │   ├── splitter.py      # Greek text splitter
│   │   └── utils.py         # Utilities
│   ├── main.py              # FastAPI server
│   ├── ingest.py            # Document ingestion
│   └── config.yml           # Configuration
└── docker-compose.yml        # Full stack deployment
\`\`\`

## Quick Start

### Prerequisites

1. **Ollama** - Install from https://ollama.ai
2. **Docker** (optional) - For containerized deployment
3. **Node.js 18+** - For Next.js frontend

### Installation

#### 1. Install Ollama Models

\`\`\`bash
ollama pull llama3.2
ollama pull nomic-embed-text
\`\`\`

#### 2. Start Weaviate

\`\`\`bash
docker run -d \
  -p 8080:8080 \
  -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
  -e PERSISTENCE_DATA_PATH=/var/lib/weaviate \
  --name weaviate \
  cr.weaviate.io/semitechnologies/weaviate:1.32.1
\`\`\`

#### 3. Install Backend Dependencies

\`\`\`bash
pip install -r scripts/requirements.txt
\`\`\`

#### 4. Add Your Documents

Place Greek military PDF or Markdown files in:
\`\`\`
scripts/data/corpus/
\`\`\`

A sample regulation file is included to test the system.

#### 5. Ingest Documents

\`\`\`bash
python scripts/ingest.py
\`\`\`

This will:
- Load all PDF and MD files from the corpus
- Split them using Greek military-aware text splitter
- Generate embeddings using Ollama
- Store vectors in Weaviate

#### 6. Start Backend

\`\`\`bash
python scripts/main.py
\`\`\`

Backend will be available at `http://localhost:8000`

#### 7. Start Frontend

The Next.js frontend is available in the preview. Just open it!

## Docker Deployment

For complete containerized deployment:

\`\`\`bash
docker-compose up -d
\`\`\`

This will start:
- Weaviate vector database
- FastAPI backend with RAG system

Note: Ollama must run on the host machine for GPU access.

## Configuration

Edit `scripts/config.yml` to customize:

\`\`\`yaml
corpus:
  input_dir: "scripts/data/corpus"
  file_types: [".pdf", ".md"]

embeddings:
  provider: "ollama"
  model: "nomic-embed-text"

llm:
  provider: "ollama"
  model: "llama3.2"
  temperature: 0.1

vector_db:
  backend: "weaviate"
  top_k: 6
\`\`\`

## API Endpoints

### REST API

- `GET /` - Service information
- `GET /health` - Health check
- `POST /query` - Non-streaming query
- `POST /upload` - Upload documents

### WebSocket

- `WS /ws/chat` - Real-time streaming chat

## Testing

\`\`\`bash
# Test health
curl http://localhost:8000/health

# Test query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Ποιες είναι οι διαδικασίες οργάνωσης μονάδων;"}'
\`\`\`

## Features in Detail

### Greek Military Text Splitter

Recognizes Greek section headers (ΤΙΤΛΟΣ) and splits documents intelligently while preserving context.

### WebSocket Streaming

Real-time token streaming for a ChatGPT-like experience with immediate feedback.

### Source Attribution

Each answer includes references to source documents for verification and transparency.

### Privacy & Security

- Runs entirely on-premises
- No external API calls
- Complete data sovereignty
- Suitable for classified networks

## System Requirements

- Python 3.11+
- Node.js 18+
- 8GB RAM minimum
- 16GB+ recommended for large corpora
- GPU optional (improves Ollama performance)

## Troubleshooting

### WebSocket Connection Issues

Ensure backend is running and accessible at `ws://localhost:8000/ws/chat`

### Ollama Connection Issues

Set `OLLAMA_HOST` environment variable:
\`\`\`bash
export OLLAMA_HOST=http://localhost:11434
\`\`\`

### Weaviate Connection Issues

Verify Weaviate is running:
\`\`\`bash
curl http://localhost:8080/v1/meta
\`\`\`

## Security Notes

For production deployment:
- Add authentication and authorization
- Use HTTPS/WSS for encrypted communication
- Configure CORS properly for your domain
- Add rate limiting
- Implement audit logging
- Encrypt sensitive data at rest

## License

Built for the Greek Armed Forces internal use.

## Support

For technical support, refer to the documentation in `scripts/README.md` for detailed backend setup instructions.
