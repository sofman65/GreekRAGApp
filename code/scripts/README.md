# Ερμής Backend - Greek Army RAG System

Complete FastAPI backend for the Greek military document retrieval system.

## Architecture

\`\`\`
scripts/
├── app/
│   ├── __init__.py          # Package initialization
│   ├── rag_service.py       # Main RAG orchestration
│   ├── vectordb.py          # Weaviate integration
│   ├── embeddings.py        # Ollama embeddings
│   ├── llm_providers.py     # Ollama chat models
│   ├── loaders.py           # PDF & Markdown loaders
│   ├── splitter.py          # Greek military text splitter
│   └── utils.py             # Configuration & utilities
├── main.py                  # FastAPI server
├── ingest.py               # Document ingestion script
├── config.yml              # System configuration
└── data/
    └── corpus/             # Place your PDF/MD files here
\`\`\`

## Setup Instructions

### 1. Install Weaviate (Vector Database)

\`\`\`bash
# Using Docker
docker run -d \
  -p 8080:8080 \
  -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
  -e PERSISTENCE_DATA_PATH=/var/lib/weaviate \
  --name weaviate \
  cr.weaviate.io/semitechnologies/weaviate:1.32.1
\`\`\`

### 2. Install Ollama (LLM & Embeddings)

\`\`\`bash
# Download from https://ollama.ai
# Or install via:
curl -fsSL https://ollama.com/install.sh | sh

# Pull required models
ollama pull llama3.2
ollama pull nomic-embed-text
\`\`\`

### 3. Install Python Dependencies

\`\`\`bash
pip install fastapi uvicorn websockets
pip install langchain langchain-ollama langchain-community
pip install weaviate-client
pip install pypdf unstructured markdown
pip install pyyaml
\`\`\`

### 4. Add Documents

Place your Greek military PDF or Markdown files in:
\`\`\`
scripts/data/corpus/
\`\`\`

### 5. Ingest Documents

\`\`\`bash
python scripts/ingest.py
\`\`\`

### 6. Start the API Server

\`\`\`bash
python scripts/main.py
\`\`\`

The API will be available at `http://localhost:8000`

## API Endpoints

### REST Endpoints

- `GET /` - Service info
- `GET /health` - Health check
- `POST /query` - Non-streaming query
  \`\`\`json
  {
    "question": "Ποιες είναι οι διαδικασίες για..."
  }
  \`\`\`
- `POST /upload` - Upload new documents

### WebSocket Endpoint

- `WS /ws/chat` - Streaming chat interface
  \`\`\`json
  {
    "question": "Τι λένε οι κανονισμοί για..."
  }
  \`\`\`

## Configuration

Edit `scripts/config.yml` to customize:
- Embedding model
- LLM model
- Chunk sizes
- Weaviate connection
- Corpus directory

## Environment Variables

- `OLLAMA_HOST` - Ollama server URL (default: http://127.0.0.1:11434)
- `CONFIG_PATH` - Path to config file (default: scripts/config.yml)

## Testing

\`\`\`bash
# Test health endpoint
curl http://localhost:8000/health

# Test query endpoint
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Τι είναι ο Ερμής;"}'
\`\`\`

## Greek Military Features

- **Title-Aware Splitting**: Recognizes Greek section headers (ΤΙΤΛΟΣ)
- **Greek Prompts**: All system prompts in Greek
- **Source Attribution**: Tracks document sources
- **PDF & Markdown Support**: Handles common military document formats
