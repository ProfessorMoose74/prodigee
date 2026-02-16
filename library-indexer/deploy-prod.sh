#!/bin/bash
set -e

# Production Environment Deployment Script
# This script deploys the library-indexer to the production environment

# Configuration
PROD_SERVER="${PROD_SERVER:-prod.example.com}"
PROD_USER="${PROD_USER:-deploy}"
PROD_PATH="${PROD_PATH:-/opt/library-indexer}"
SERVICE_NAME="library-indexer"
ENVIRONMENT="production"

echo "========================================="
echo "Deploying to PRODUCTION Environment"
echo "Server: ${PROD_SERVER}"
echo "Path: ${PROD_PATH}"
echo "========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Safety check for production deployment
if [ "$1" != "--confirm" ]; then
    print_warning "This will deploy to PRODUCTION!"
    print_warning "Please confirm by running: $0 --confirm"
    exit 1
fi

# Check if running from Jenkins or locally
if [ -n "${JENKINS_HOME}" ]; then
    print_status "Running from Jenkins environment"
    ARTIFACT_FILE="library-indexer-${BUILD_NUMBER}.tar.gz"
else
    print_status "Running locally - using latest artifact"
    ARTIFACT_FILE=$(ls -t library-indexer-*.tar.gz 2>/dev/null | head -1)
    if [ -z "${ARTIFACT_FILE}" ]; then
        print_error "No artifact file found. Please build first."
        exit 1
    fi
fi

print_status "Using artifact: ${ARTIFACT_FILE}"

# Pre-deployment health check
print_status "Performing pre-deployment health check..."
ssh "${PROD_USER}@${PROD_SERVER}" << 'ENDSSH'
set -e
echo "Checking disk space..."
df -h /opt
echo "Checking current service status..."
sudo systemctl status library-indexer.service --no-pager || echo "Service not running"
ENDSSH

# Deploy to production server with zero-downtime strategy
print_status "Copying artifact to production server..."
scp "${ARTIFACT_FILE}" "${PROD_USER}@${PROD_SERVER}:/tmp/"

print_status "Deploying on production server..."
ssh "${PROD_USER}@${PROD_SERVER}" << ENDSSH
set -e

echo "Creating deployment directory..."
sudo mkdir -p ${PROD_PATH}
sudo chown ${PROD_USER}:${PROD_USER} ${PROD_PATH}

echo "Creating deployment timestamp..."
TIMESTAMP=\$(date +%Y%m%d-%H%M%S)
DEPLOY_DIR="${PROD_PATH}/releases/\${TIMESTAMP}"

echo "Creating release directory..."
mkdir -p \${DEPLOY_DIR}

echo "Extracting artifact..."
cd /tmp
tar -xzf $(basename ${ARTIFACT_FILE}) -C \${DEPLOY_DIR}

echo "Setting up Python virtual environment..."
cd \${DEPLOY_DIR}
python3.11 -m venv venv || python3 -m venv venv

echo "Installing dependencies..."
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

echo "Running smoke tests..."
python -c "import digital_library_system; print('Module import successful')"

echo "Backing up current deployment..."
if [ -L "${PROD_PATH}/current" ]; then
    CURRENT_RELEASE=\$(readlink ${PROD_PATH}/current)
    echo "Current release: \${CURRENT_RELEASE}"
fi

echo "Creating/updating systemd service..."
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null << 'EOSERVICE'
[Unit]
Description=Library Indexer Production Service
After=network.target

[Service]
Type=simple
User=${PROD_USER}
WorkingDirectory=${PROD_PATH}/current
Environment="ENVIRONMENT=production"
Environment="LOG_LEVEL=INFO"
ExecStart=${PROD_PATH}/current/venv/bin/python ${PROD_PATH}/current/digital_library_system.py --source gutenberg --limit 1000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Production-specific settings
LimitNOFILE=65536
MemoryLimit=2G
CPUQuota=80%

[Install]
WantedBy=multi-user.target
EOSERVICE

echo "Creating new symlink..."
ln -sfn \${DEPLOY_DIR} ${PROD_PATH}/current

echo "Reloading systemd and restarting service..."
sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}.service
sudo systemctl restart ${SERVICE_NAME}.service

echo "Waiting for service to stabilize..."
sleep 10

echo "Performing post-deployment health check..."
if sudo systemctl is-active --quiet ${SERVICE_NAME}.service; then
    echo "Service is running successfully!"
    
    # Clean up old releases (keep last 5)
    echo "Cleaning up old releases..."
    cd ${PROD_PATH}/releases
    ls -t | tail -n +6 | xargs -r rm -rf
    
    echo "Cleaning up artifact..."
    rm -f /tmp/$(basename ${ARTIFACT_FILE})
    
    echo "========================================="
    echo "Production deployment completed successfully!"
    echo "Service: ${SERVICE_NAME}"
    echo "Release: \${TIMESTAMP}"
    echo "Path: ${PROD_PATH}/current -> \${DEPLOY_DIR}"
    echo "========================================="
else
    echo "ERROR: Service failed to start!"
    echo "Rolling back to previous release..."
    if [ -n "\${CURRENT_RELEASE}" ]; then
        ln -sfn \${CURRENT_RELEASE} ${PROD_PATH}/current
        sudo systemctl restart ${SERVICE_NAME}.service
        echo "Rollback completed"
    fi
    exit 1
fi
ENDSSH

print_status "Production deployment completed!"
print_status "You can check logs with: ssh ${PROD_USER}@${PROD_SERVER} 'sudo journalctl -u ${SERVICE_NAME} -f'"