#!/bin/bash
set -e

# Test Environment Deployment Script
# This script deploys the library-indexer to the test environment

# Configuration
TEST_SERVER="${TEST_SERVER:-test.example.com}"
TEST_USER="${TEST_USER:-deploy}"
TEST_PATH="${TEST_PATH:-/opt/library-indexer-test}"
SERVICE_NAME="library-indexer-test"
ENVIRONMENT="test"

echo "========================================="
echo "Deploying to TEST Environment"
echo "Server: ${TEST_SERVER}"
echo "Path: ${TEST_PATH}"
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

# Deploy to test server
print_status "Copying artifact to test server..."
scp "${ARTIFACT_FILE}" "${TEST_USER}@${TEST_SERVER}:/tmp/"

print_status "Deploying on test server..."
ssh "${TEST_USER}@${TEST_SERVER}" << ENDSSH
set -e

echo "Creating deployment directory..."
sudo mkdir -p ${TEST_PATH}
sudo chown ${TEST_USER}:${TEST_USER} ${TEST_PATH}

echo "Extracting artifact..."
cd /tmp
tar -xzf $(basename ${ARTIFACT_FILE})

echo "Backing up current deployment if exists..."
if [ -d "${TEST_PATH}/current" ]; then
    sudo mv ${TEST_PATH}/current ${TEST_PATH}/backup-\$(date +%Y%m%d-%H%M%S)
fi

echo "Creating new deployment..."
mkdir -p ${TEST_PATH}/current
cp -r digital_library_system.py requirements.txt ElementalGeniusLibraryServerInstructions.md ${TEST_PATH}/current/ 2>/dev/null || true

echo "Setting up Python virtual environment..."
cd ${TEST_PATH}/current
if [ ! -d "venv" ]; then
    python3.11 -m venv venv || python3 -m venv venv
fi

echo "Installing dependencies..."
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

echo "Creating systemd service..."
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null << 'EOSERVICE'
[Unit]
Description=Library Indexer Test Service
After=network.target

[Service]
Type=simple
User=${TEST_USER}
WorkingDirectory=${TEST_PATH}/current
Environment="ENVIRONMENT=test"
Environment="LOG_LEVEL=DEBUG"
ExecStart=${TEST_PATH}/current/venv/bin/python ${TEST_PATH}/current/digital_library_system.py --source gutenberg --limit 50 --test-mode
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOSERVICE

echo "Reloading systemd and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}.service
sudo systemctl restart ${SERVICE_NAME}.service

echo "Waiting for service to start..."
sleep 5

echo "Checking service status..."
sudo systemctl status ${SERVICE_NAME}.service --no-pager

echo "Cleaning up..."
rm -f /tmp/$(basename ${ARTIFACT_FILE})

echo "========================================="
echo "Test deployment completed successfully!"
echo "Service: ${SERVICE_NAME}"
echo "Path: ${TEST_PATH}/current"
echo "========================================="
ENDSSH

print_status "Test deployment completed!"
print_status "You can check logs with: ssh ${TEST_USER}@${TEST_SERVER} 'sudo journalctl -u ${SERVICE_NAME} -f'"