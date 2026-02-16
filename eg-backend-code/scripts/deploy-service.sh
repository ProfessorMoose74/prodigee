#!/bin/bash
# Deploy systemd service for Elemental Genius
# Usage: ./deploy-service.sh [test|prod]

set -e

ENVIRONMENT=${1:-test}
SERVICE_NAME="elemental-genius-$ENVIRONMENT"

echo "Deploying systemd service for environment: $ENVIRONMENT"

# Copy service file and customize for environment
sudo cp elemental-genius.service /etc/systemd/system/$SERVICE_NAME.service

# Update service file with environment-specific settings
sudo sed -i "s|elemental-genius-\${environment}|$SERVICE_NAME|g" /etc/systemd/system/$SERVICE_NAME.service

# Create user if doesn't exist
if ! id "elemental-genius" &>/dev/null; then
    sudo useradd -r -s /bin/false elemental-genius
fi

# Create directories
sudo mkdir -p /opt/elemental-genius/{current,config}
sudo chown -R elemental-genius:elemental-genius /opt/elemental-genius

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME

echo "Service $SERVICE_NAME deployed successfully!"
echo "Use 'sudo systemctl start $SERVICE_NAME' to start the service"