# Infrastructure

Infrastructure as code and deployment scripts for the Prodigee platform on GCP.

## GCP Project

| Property | Value |
|----------|-------|
| Project ID | `prodigee-488119` |
| Project Number | `446166630230` |
| Region | `us-east1` |
| Firestore Location | `nam5` (multi-region US) |
| Artifact Registry | `us-east1-docker.pkg.dev/prodigee-488119/prodigee/` |

## Enabled APIs

- Cloud Run (`run.googleapis.com`)
- Cloud Build (`cloudbuild.googleapis.com`)
- Firestore (`firestore.googleapis.com`)
- Firebase (`firebase.googleapis.com`)
- Secret Manager (`secretmanager.googleapis.com`)
- Cloud Storage (`storage.googleapis.com`)
- Artifact Registry (`artifactregistry.googleapis.com`)
- IAM (`iam.googleapis.com`)
- Vertex AI (`aiplatform.googleapis.com`)
- Cloud Translation (`translate.googleapis.com`)
- Cloud Speech-to-Text (`speech.googleapis.com`)
- Cloud Vision (`vision.googleapis.com`)
- Cloud SQL (`sqladmin.googleapis.com`)
- Identity Platform (`identitytoolkit.googleapis.com`)
- Compute Engine (`compute.googleapis.com`)
- Cloud Logging (`logging.googleapis.com`)
- Cloud Monitoring (`monitoring.googleapis.com`)

## Cloud Run Services

| Service Name | Source | Public |
|-------------|--------|--------|
| `prodigee-gateway` | `services/gateway/` | Yes (client-facing) |
| `prodigee-auth` | `services/auth/` | No (internal only) |
| `prodigee-learning-engine` | `services/learning-engine/` | No (internal only) |
| `prodigee-analytics` | `services/analytics/` | No (internal only) |
| `prodigee-ar-vr` | `services/ar-vr/` | No (internal only) |

## CI/CD

Cloud Build pipeline defined in `cloudbuild.yaml` (repo root):
1. Builds all 5 service Docker images in parallel
2. Pushes to Artifact Registry with commit SHA and `latest` tags
3. Deploys each to Cloud Run

## Terraform (Planned)

The `terraform/` directory will contain:
- Cloud Run service definitions
- Firestore indexes
- Secret Manager secrets
- IAM bindings
- Cloud Build triggers
- Artifact Registry configuration

## Scripts (Planned)

The `scripts/` directory will contain:
- `deploy.sh` — Manual deployment helper
- `seed-firestore.sh` — Load curriculum data into Firestore
- `setup-secrets.sh` — Populate Secret Manager with required secrets
