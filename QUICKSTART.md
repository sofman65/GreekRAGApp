# Ερμής - Quick Start Guide

Get Ερμής running in 5 minutes!

## 🚀 Prerequisites

1. **Docker & Docker Compose** (recommended)
   ```bash
   # Check installation
   docker --version
   docker-compose --version
   ```

2. **Ollama** - [Download from ollama.ai](https://ollama.ai)
   ```bash
   # Install required models
   ollama pull llama3.2
   ollama pull nomic-embed-text
   ```

## 📦 Quick Start with Docker

### Step 1: Clone Repository

```bash
git clone <your-repository-url>
cd pithiaApp
```

### Step 2: Start Services

```bash
# Start everything (Weaviate, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f
```

### Step 3: Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

### Step 4: Login

- **Username**: `admin`
- **Password**: `1234`

⚠️ Change these credentials in production!

## 🎯 Quick Test

### 1. Via Web Interface

1. Open http://localhost:3000
2. Login with credentials
3. Ask: "Ποιες είναι οι βασικές αρχές των κανονισμών;"
4. Receive AI-powered answer!

### 2. Via API

```bash
# Health check
curl http://localhost:8000/api/health

# Query the system
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Ποιες είναι οι διαδικασίες για άδεια;"}'
```

## 📄 Add Your Documents

```bash
# 1. Add documents to corpus
cp your-documents.pdf backend/data/corpus/

# 2. Run ingestion
docker-compose exec backend python scripts/ingest.py

# 3. Query your documents!
```

## 🛠️ Local Development Setup

### Backend

```bash
cd backend

# Setup
./scripts/setup.sh

# Start
./scripts/start.sh
```

### Frontend

```bash
cd code

# Install
npm install

# Start
npm run dev
```

## 🔍 Troubleshooting

### Services Not Starting?

```bash
# Check what's running
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs weaviate

# Restart services
docker-compose restart
```

### Can't Connect to Ollama?

```bash
# Check Ollama is running
ollama list

# Start Ollama service
ollama serve

# Verify models
ollama pull llama3.2
ollama pull nomic-embed-text
```

### Port Already in Use?

```bash
# Check what's using ports
lsof -i :8000  # Backend
lsof -i :3000  # Frontend
lsof -i :8080  # Weaviate

# Stop conflicting services or change ports in docker-compose.yml
```

## 🎓 Next Steps

1. **Read Documentation**
   - [Full README](README.md)
   - [Backend Documentation](backend/README.md)
   - [Deployment Guide](DEPLOYMENT.md)

2. **Customize Configuration**
   - Edit `backend/config/config.yml`
   - Update models and parameters
   - Add your documents

3. **Set Up for Production**
   - Change default credentials
   - Configure HTTPS
   - Set up backups
   - Enable monitoring

## 📞 Need Help?

- Check logs: `docker-compose logs -f`
- View health: http://localhost:8000/api/health
- Read troubleshooting: [README.md](README.md)

## 🎉 Success!

You should now have Ερμής running! Try asking questions in Greek about your military regulations and procedures.

---

**Happy querying! 🇬🇷**

