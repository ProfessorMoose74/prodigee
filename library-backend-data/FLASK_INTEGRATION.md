# Flask Backend Integration Guide

This document explains how the Library Server integrates with the Elemental Genius Flask backend.

## Integration Overview

The Library Server is designed as a **microservice** that works alongside the Flask backend to provide specialized content management and delivery capabilities.

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Flask Backend │    │  Library Server  │    │   PostgreSQL    │
│   (Port 8000)   │    │   (Port 8001)    │    │   Database      │
│                 │    │                  │    │                 │
│ • Authentication│◄──►│ • Content Mgmt   │◄──►│ • Shared Schema │
│ • User Sessions │    │ • File Serving   │    │ • User Data     │
│ • AI Processing │    │ • Search API     │    │ • Content Data  │
│ • SocketIO      │    │ • Caching        │    │ • Progress      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
          │                       │
          └───────────────────────┘
                 Redis
             (Shared Cache)
```

## Database Integration

### Shared Database Schema

Both servers use the **same PostgreSQL database** (`elemental_genius`) with these shared tables:

#### User Tables (Managed by Flask Backend):
- `parent` - Parent user accounts
- `child` - Child user accounts with learning profiles

#### Content Tables (Managed by Library Server):
- `content_library` - Educational content metadata
- `heggerty_curriculum_data` - Phonemic awareness curriculum
- `nursery_rhyme_data` - Nursery rhyme content
- `multi_subject_curriculum` - Multi-subject educational content

#### Analytics Tables (Shared):
- `progress` - Child learning progress
- `learning_session` - Session tracking
- `assessment` - Educational assessments
- `voice_interaction` - Voice processing results
- `system_analytics` - System performance metrics

### Database Connection

Both services use the same database URL format:
```
postgresql://user:password@database-host:5432/elemental_genius
```

## Authentication Integration

### JWT Token Compatibility

The Library Server uses **identical JWT configuration** to the Flask backend:

```python
# Shared Configuration
SECRET_KEY = "your-super-secret-key-for-jwt-and-sessions"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
```

### Token Format

Tokens created by the Flask backend are fully compatible with the Library Server:

```json
{
  "user_id": 123,
  "user_type": "parent|child", 
  "exp": 1234567890,
  "iat": 1234567890,
  "sub": "123"
}
```

### Authentication Flow

1. User logs in via Flask backend (`/parent/login` or `/child/login`)
2. Flask backend creates JWT token
3. Frontend includes token in requests to Library Server
4. Library Server validates token using shared secret key
5. Library Server verifies user exists in shared database

## API Endpoint Mapping

### Flask Backend Compatible Endpoints

The Library Server provides endpoints that match Flask backend expectations:

| Flask Backend Route | Library Server Route | Purpose |
|--------------------|--------------------|---------|
| `GET /content` | `GET /content/` | Get content library with filters |
| `GET /content/<int:id>` | `GET /content/{content_id}` | Get specific content item |
| `POST /content` | `POST /content/` | Create new content |
| `GET /content/<path:filename>` | `GET /content/{filename:path}` | Serve content files |
| `GET /assets/<path:filename>` | `GET /assets/{filename:path}` | Serve asset files |
| `POST /api/content/upload` | `POST /upload` | Upload content files |

### Extended API Endpoints

Additional endpoints for enhanced functionality:

- `GET /content/child/{child_id}/recommendations` - Personalized content recommendations
- `GET /content/subjects` - Available subject areas
- `GET /content/age-ranges` - Available age ranges
- `GET /content/content-types` - Available content types
- `GET /download/{content_id}` - Download content with analytics tracking

## File Management Integration

### Shared File Storage

Both servers access the same file storage locations:

```bash
/data/
├── content/          # Educational content files
│   ├── audio/        # Audio files (.mp3, .wav)
│   ├── video/        # Video files (.mp4, .webm) 
│   ├── images/       # Image files (.jpg, .png, .gif)
│   └── documents/    # PDF and text files
├── assets/           # Static assets
│   ├── images/       # UI images
│   ├── icons/        # Application icons
│   └── themes/       # Theme assets
└── uploads/          # Temporary upload storage
```

### File Serving Strategy

- **Flask Backend**: Handles file uploads and basic serving
- **Library Server**: Provides optimized file serving with caching and analytics
- **CDN Integration**: Both can work with CDN for production deployments

## Redis Integration

### Shared Redis Instance

Both servers use the same Redis instance for:

```
redis://redis-host:6379/0
```

### Usage Patterns

- **Flask Backend**: Session storage, Celery message queue, SocketIO messages
- **Library Server**: Content caching, search result caching, rate limiting

### Cache Key Conventions

```
# Flask Backend Keys
flask_session:{session_id}
celery_task:{task_id}
socketio_room:{room_id}

# Library Server Keys  
content_cache:{content_id}
search_cache:{query_hash}
rate_limit:{user_id}:{endpoint}
```

## Deployment Configuration

### Development Setup

1. **Start Flask Backend** (Port 8000):
```bash
cd /path/to/flask-backend
python elemental_genius_backend.py
```

2. **Start Library Server** (Port 8001):
```bash
cd /path/to/library-server
docker-compose up -d
# OR
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### Production Deployment

Use Docker Compose to deploy both services:

```yaml
version: '3.8'
services:
  flask-backend:
    build: ./flask-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/elemental_genius
      - REDIS_URL=redis://redis:6379/0
    
  library-server:
    build: ./library-server
    ports:
      - "8001:8001" 
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/elemental_genius
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=your-super-secret-key-for-jwt-and-sessions
    
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=elemental_genius
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### Load Balancer Configuration

For production, use Nginx to route requests:

```nginx
upstream flask_backend {
    server flask-backend:8000;
}

upstream library_server {
    server library-server:8001;
}

server {
    listen 80;
    
    # Route content and file requests to Library Server
    location ~ ^/(content|assets|api/content) {
        proxy_pass http://library_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Route all other requests to Flask Backend
    location / {
        proxy_pass http://flask_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Integration Testing

### Health Checks

Both services provide health check endpoints:

- Flask Backend: `GET /` or custom health endpoint
- Library Server: `GET /health`

### Cross-Service Communication

Test authentication flow:

```python
import requests
import jwt

# 1. Login via Flask Backend
login_response = requests.post('http://localhost:8000/parent/login', {
    'email': 'test@example.com',
    'password': 'password'
})
token = login_response.json()['access_token']

# 2. Use token with Library Server
content_response = requests.get(
    'http://localhost:8001/content/', 
    headers={'Authorization': f'Bearer {token}'}
)
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify SECRET_KEY matches between services
   - Check JWT token format and expiration
   - Ensure user exists in shared database

2. **Database Connection Issues**
   - Confirm both services use same DATABASE_URL
   - Check PostgreSQL connection limits
   - Verify database schema synchronization

3. **File Serving Problems**
   - Check file path configurations
   - Verify shared volume mounts in Docker
   - Confirm file permissions

4. **Redis Connection Issues**
   - Ensure both services use same REDIS_URL
   - Check Redis memory limits
   - Monitor cache key conflicts

### Monitoring

Monitor both services with:

```bash
# Check service health
curl http://localhost:8000/
curl http://localhost:8001/health

# Monitor logs
docker-compose logs -f flask-backend
docker-compose logs -f library-server

# Database connections
psql -h localhost -U user -d elemental_genius -c "SELECT * FROM pg_stat_activity;"
```

This integration provides a scalable, maintainable architecture where each service has clear responsibilities while sharing essential data and authentication systems.