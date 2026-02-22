#!/usr/bin/env bash
# ============================================================================
# Prodigee — GCP Secret Manager Setup
# ============================================================================
# Run this script once to create and configure secrets for production.
#
# Prerequisites:
#   - gcloud CLI authenticated: gcloud auth login
#   - Project set: gcloud config set project prodigee-488119
#   - Secret Manager API enabled (already enabled in project)
#
# Usage:
#   chmod +x infra/setup-secrets.sh
#   ./infra/setup-secrets.sh
# ============================================================================

set -euo pipefail

PROJECT_ID="prodigee-488119"
REGION="us-east1"

echo "=== Prodigee Secret Manager Setup ==="
echo "Project: ${PROJECT_ID}"
echo ""

# ---- 1. Enable Secret Manager API (idempotent) ----
echo "[1/5] Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com --project="${PROJECT_ID}" 2>/dev/null || true
echo "  Done."

# ---- 2. Generate and create JWT secret ----
echo "[2/5] Creating jwt-secret..."

# Check if secret already exists
if gcloud secrets describe jwt-secret --project="${PROJECT_ID}" &>/dev/null; then
    echo "  Secret 'jwt-secret' already exists."
    read -rp "  Add a new version? (y/N): " ADD_VERSION
    if [[ "${ADD_VERSION}" =~ ^[Yy]$ ]]; then
        JWT_SECRET=$(openssl rand -base64 48)
        echo -n "${JWT_SECRET}" | gcloud secrets versions add jwt-secret \
            --project="${PROJECT_ID}" \
            --data-file=-
        echo "  New version added."
    fi
else
    JWT_SECRET=$(openssl rand -base64 48)
    echo -n "${JWT_SECRET}" | gcloud secrets create jwt-secret \
        --project="${PROJECT_ID}" \
        --replication-policy="automatic" \
        --data-file=-
    echo "  Created with auto-generated 48-byte secret."
fi

# ---- 3. Grant Cloud Build service account access ----
echo "[3/5] Granting Cloud Build access to secrets..."

PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

gcloud secrets add-iam-policy-binding jwt-secret \
    --project="${PROJECT_ID}" \
    --member="serviceAccount:${CLOUDBUILD_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet 2>/dev/null || true
echo "  Cloud Build SA (${CLOUDBUILD_SA}) granted secretAccessor."

# ---- 4. Grant Cloud Run service accounts access ----
echo "[4/5] Granting Cloud Run service accounts access to secrets..."

# Default compute service account (used by Cloud Run unless custom SA configured)
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding jwt-secret \
    --project="${PROJECT_ID}" \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet 2>/dev/null || true
echo "  Compute SA (${COMPUTE_SA}) granted secretAccessor."

# ---- 5. Verify ----
echo "[5/5] Verifying secret..."
echo ""

LATEST_VERSION=$(gcloud secrets versions list jwt-secret \
    --project="${PROJECT_ID}" \
    --format='value(name)' \
    --limit=1 2>/dev/null || echo "NONE")

if [[ "${LATEST_VERSION}" != "NONE" ]]; then
    echo "  jwt-secret latest version: ${LATEST_VERSION}"
    echo "  Status: READY"
else
    echo "  ERROR: Could not verify secret."
    exit 1
fi

echo ""
echo "=== Secret Manager Setup Complete ==="
echo ""
echo "Cloud Run deploy commands will use:"
echo "  --set-secrets=AUTH_JWT_SECRET=jwt-secret:latest"
echo "  --set-secrets=LEARNING_JWT_SECRET=jwt-secret:latest"
echo "  --set-secrets=ANALYTICS_JWT_SECRET=jwt-secret:latest"
echo ""
echo "These are already configured in cloudbuild.yaml."
