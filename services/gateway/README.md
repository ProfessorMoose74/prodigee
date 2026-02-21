# Gateway Service

API Gateway for the Prodigee platform. All client traffic routes through here.

## Responsibilities

- Route requests to internal microservices based on URL path prefix
- Validate authentication tokens before forwarding
- Rate limiting per client/IP
- Manage external-facing CORS policy
- Aggregate health checks from downstream services

## Route Map

| Path Prefix | Target Service |
|-------------|---------------|
| `/auth/*` | Auth Service (:8081) |
| `/learning/*` | Learning Engine (:8082) |
| `/analytics/*` | Analytics Service (:8083) |
| `/ar-vr/*` | AR/VR Service (:8084) |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `GATEWAY_ENVIRONMENT` | `development` | Environment (development/staging/production) |
| `GATEWAY_AUTH_SERVICE_URL` | `http://localhost:8081` | Auth service URL |
| `GATEWAY_LEARNING_SERVICE_URL` | `http://localhost:8082` | Learning engine URL |
| `GATEWAY_ANALYTICS_SERVICE_URL` | `http://localhost:8083` | Analytics service URL |
| `GATEWAY_AR_VR_SERVICE_URL` | `http://localhost:8084` | AR/VR service URL |
| `GATEWAY_CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins |
| `GATEWAY_RATE_LIMIT_REQUESTS` | `100` | Requests per window |
| `GATEWAY_RATE_LIMIT_WINDOW_SECONDS` | `60` | Rate limit window |

## Run Locally

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8080 --reload
```
