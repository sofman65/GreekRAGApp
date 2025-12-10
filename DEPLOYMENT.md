# Ερμής - Production Deployment Guide

This guide covers deploying Ερμής to a production environment.

## 🔒 Security Prerequisites

Before deploying to production, ensure:

1. **Network Security**
   - Deploy behind a firewall
   - Use internal network only
   - Enable VPN access if remote access needed

2. **SSL/TLS**
   - Obtain valid SSL certificates
   - Configure HTTPS for all services
   - Disable HTTP access

3. **Access Control**
   - Implement role-based access control (RBAC)
   - Use strong password policies
   - Enable two-factor authentication (2FA)

4. **Secrets Management**
   - Use environment variables or secrets manager
   - Never commit secrets to version control
   - Rotate keys regularly

## 🚀 Production Deployment

### Option 1: Docker Compose (Recommended for Single Server)

#### 1. Prepare Environment

```bash
# Create production directory
mkdir -p /opt/pithia
cd /opt/pithia

# Clone repository
git clone <your-repo> .

# Create production environment files
```

**Backend Environment** (`backend/.env`):
```bash
HOST=0.0.0.0
PORT=8000
DEBUG=False

# Generate strong secret key
SECRET_KEY=$(openssl rand -hex 32)

# Services
WEAVIATE_URL=http://weaviate:8080
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_HOST=http://host.docker.internal:11434

# Database (when implemented)
DATABASE_URL=postgresql://user:password@postgres:5432/pithia
```

**Frontend Environment** (`code/.env.production`):
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.mil.gr
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.mil.gr
```

#### 2. Deploy Services

```bash
# Pull latest images
docker-compose pull

# Build custom images
docker-compose build --no-cache

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

#### 3. Configure Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/pithia`:

```nginx
# Backend API
upstream pithia_backend {
    server localhost:8000;
}

# Frontend
upstream pithia_frontend {
    server localhost:3000;
}

# Backend API Server
server {
    listen 443 ssl http2;
    server_name api.yourdomain.mil.gr;

    ssl_certificate /etc/ssl/certs/pithia.crt;
    ssl_certificate_key /etc/ssl/private/pithia.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://pithia_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Frontend Server
server {
    listen 443 ssl http2;
    server_name pithia.yourdomain.mil.gr;

    ssl_certificate /etc/ssl/certs/pithia.crt;
    ssl_certificate_key /etc/ssl/private/pithia.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://pithia_frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.mil.gr pithia.yourdomain.mil.gr;
    return 301 https://$server_name$request_uri;
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/pithia /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Option 2: Kubernetes Deployment

See `k8s/` directory for Kubernetes manifests.

## 📊 Monitoring

### 1. Application Monitoring

```bash
# Install monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d
```

**Prometheus Configuration** (`monitoring/prometheus.yml`):
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'pithia-backend'
    static_configs:
      - targets: ['backend:8000']
  
  - job_name: 'weaviate'
    static_configs:
      - targets: ['weaviate:8080']
```

### 2. Log Aggregation

Use centralized logging:

```bash
# Configure log shipping to your SIEM
docker-compose logs -f | your-log-shipper
```

### 3. Health Checks

Set up automated health checks:

```bash
# Health check script
#!/bin/bash
curl -f http://localhost:8000/api/health || exit 1
curl -f http://localhost:3000 || exit 1
curl -f http://localhost:8080/v1/.well-known/ready || exit 1
```

Add to cron:
```bash
*/5 * * * * /opt/pithia/health-check.sh || /opt/pithia/alert.sh
```

## 💾 Backup Strategy

### 1. Database Backup

```bash
# Weaviate backup script
#!/bin/bash
BACKUP_DIR="/backup/weaviate/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup Weaviate data
docker exec pithia-weaviate \
  weaviate-cli backup create \
  --backend filesystem \
  --path $BACKUP_DIR

# Compress
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Rotate backups (keep 30 days)
find /backup/weaviate -name "*.tar.gz" -mtime +30 -delete
```

### 2. Document Backup

```bash
# Backup corpus documents
rsync -av /opt/pithia/backend/data/corpus/ /backup/corpus/
```

### 3. Configuration Backup

```bash
# Backup configurations
tar -czf /backup/config/pithia-config-$(date +%Y%m%d).tar.gz \
  /opt/pithia/backend/config/ \
  /opt/pithia/backend/.env \
  /opt/pithia/code/.env.production
```

## 🔄 Updates and Maintenance

### Update Procedure

```bash
# 1. Backup current state
./backup.sh

# 2. Pull latest changes
cd /opt/pithia
git fetch origin
git checkout <version-tag>

# 3. Stop services
docker-compose down

# 4. Rebuild images
docker-compose build --no-cache

# 5. Start services
docker-compose up -d

# 6. Verify health
docker-compose ps
./health-check.sh

# 7. Check logs
docker-compose logs -f
```

### Rollback Procedure

```bash
# Revert to previous version
git checkout <previous-version-tag>
docker-compose down
docker-compose up -d
```

## 🔍 Troubleshooting

### Common Issues

#### High Memory Usage

```bash
# Check container resources
docker stats

# Adjust memory limits in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G
```

#### Slow Response Times

1. Check Ollama model loading
2. Increase Weaviate resources
3. Enable response caching
4. Optimize chunk sizes

#### Connection Issues

```bash
# Check network connectivity
docker network inspect pithia-network

# Check service health
docker-compose ps
docker-compose logs backend
docker-compose logs weaviate
```

## 📈 Performance Tuning

### Backend Optimization

```python
# In backend/app/main.py
app = FastAPI(
    # Enable compression
    middleware=[
        Middleware(GZipMiddleware, minimum_size=1000)
    ]
)

# Add caching
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

@app.on_event("startup")
async def startup():
    redis = aioredis.from_url("redis://localhost")
    FastAPICache.init(RedisBackend(redis), prefix="pithia-cache:")
```

### Weaviate Optimization

```yaml
# docker-compose.yml
services:
  weaviate:
    environment:
      QUERY_MAXIMUM_RESULTS: 10000
      QUERY_DEFAULTS_LIMIT: 25
      REINDEX_VECTOR_DIMENSIONS_AT_STARTUP: false
    volumes:
      - type: tmpfs
        target: /tmp
        tmpfs:
          size: 2G
```

### Frontend Optimization

```javascript
// next.config.mjs
const nextConfig = {
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    domains: ['yourdomain.mil.gr'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Enable SWC minification
  swcMinify: true,
}
```

## 🔐 Security Hardening

### 1. Network Security

```bash
# Firewall rules (UFW example)
ufw default deny incoming
ufw default allow outgoing
ufw allow from 10.0.0.0/8 to any port 443 proto tcp
ufw allow from 10.0.0.0/8 to any port 80 proto tcp
ufw enable
```

### 2. Container Security

```yaml
# docker-compose.yml
services:
  backend:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    user: "1000:1000"
```

### 3. Secrets Management

Use Docker secrets or external secrets manager:

```bash
# Create secrets
echo "your-secret-key" | docker secret create pithia_secret_key -

# Use in docker-compose.yml
services:
  backend:
    secrets:
      - pithia_secret_key
    environment:
      SECRET_KEY_FILE: /run/secrets/pithia_secret_key
```

## 📞 Support Contacts

- **System Administrator**: admin@yourdomain.mil.gr
- **Security Team**: security@yourdomain.mil.gr
- **IT Support**: helpdesk@yourdomain.mil.gr

## 📋 Compliance Checklist

- [ ] Security audit completed
- [ ] Penetration testing performed
- [ ] Access controls configured
- [ ] Backups tested and verified
- [ ] Monitoring configured
- [ ] Incident response plan documented
- [ ] User training completed
- [ ] Documentation updated
- [ ] Change management approval obtained
- [ ] Disaster recovery plan tested

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-12  
**Classification**: Internal Use Only

