#!/usr/bin/env bash
# ============================================================================
# Prodigee — Cloud Run Domain Mapping Setup
# ============================================================================
# Maps getprodigee.com and getprodigee.net to the gateway Cloud Run service.
#
# Prerequisites:
#   - gcloud CLI authenticated: gcloud auth login
#   - Project set: gcloud config set project prodigee-488119
#   - Domain ownership verified in Google Search Console
#   - Gateway service deployed to Cloud Run
#
# After running this script, update DNS records at your registrar:
#   - The script will output the required CNAME/A records
#
# Usage:
#   chmod +x infra/setup-domain.sh
#   ./infra/setup-domain.sh
# ============================================================================

set -euo pipefail

PROJECT_ID="prodigee-488119"
REGION="us-east1"
SERVICE="prodigee-gateway"
DOMAINS=("getprodigee.com" "www.getprodigee.com" "getprodigee.net" "www.getprodigee.net")

echo "=== Prodigee Domain Mapping Setup ==="
echo "Project: ${PROJECT_ID}"
echo "Service: ${SERVICE}"
echo "Region:  ${REGION}"
echo ""

# ---- 1. Verify domain ownership ----
echo "[1/3] Verifying domain ownership..."
echo "  If this fails, verify ownership at: https://search.google.com/search-console"
echo ""

for DOMAIN in "${DOMAINS[@]}"; do
    # Only verify apex domains, not subdomains
    if [[ "${DOMAIN}" != www.* ]]; then
        gcloud domains verify "${DOMAIN}" --project="${PROJECT_ID}" 2>/dev/null || \
            echo "  NOTE: ${DOMAIN} may need manual verification in Search Console."
    fi
done

# ---- 2. Create domain mappings ----
echo ""
echo "[2/3] Creating domain mappings..."
echo ""

for DOMAIN in "${DOMAINS[@]}"; do
    echo "  Mapping ${DOMAIN} -> ${SERVICE}..."
    gcloud run domain-mappings create \
        --service="${SERVICE}" \
        --domain="${DOMAIN}" \
        --region="${REGION}" \
        --project="${PROJECT_ID}" 2>/dev/null || \
        echo "    Already mapped or needs attention."
done

# ---- 3. Show required DNS records ----
echo ""
echo "[3/3] Required DNS records:"
echo ""
echo "  Configure these at your domain registrar:"
echo ""

for DOMAIN in "${DOMAINS[@]}"; do
    echo "  --- ${DOMAIN} ---"
    gcloud run domain-mappings describe \
        --domain="${DOMAIN}" \
        --region="${REGION}" \
        --project="${PROJECT_ID}" \
        --format="table(resourceRecords.type, resourceRecords.name, resourceRecords.rrdata)" \
        2>/dev/null || echo "    (run after mapping is created)"
    echo ""
done

echo "=== Domain Mapping Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Add the DNS records shown above at your domain registrar"
echo "  2. Wait for DNS propagation (can take up to 48 hours)"
echo "  3. SSL certificates are provisioned automatically by Cloud Run"
echo "  4. Verify with: gcloud run domain-mappings list --region=${REGION}"
