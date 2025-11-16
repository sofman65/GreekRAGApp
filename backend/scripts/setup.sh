#!/bin/bash

# Ερμής Backend Setup Script

echo "🛠️  Setting up Ερμής Backend..."

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data/corpus
mkdir -p logs

# Copy .env.example to .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration!"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your configuration"
echo "2. Start Weaviate: docker run -p 8080:8080 semitechnologies/weaviate:latest"
echo "3. Ensure Ollama is running with models: llama3.2 and nomic-embed-text"
echo "4. Add documents to backend/data/corpus/"
echo "5. Run ingestion: python scripts/ingest.py"
echo "6. Start server: ./scripts/start.sh"
echo ""

