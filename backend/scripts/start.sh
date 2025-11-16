#!/bin/bash

# Ερμής Backend Startup Script

echo "🚀 Starting Ερμής Backend Server..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
fi

# Check if .env exists, if not copy from example
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration!"
fi

# Export PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Run the server
echo "✓ Starting FastAPI server on http://localhost:8000"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

