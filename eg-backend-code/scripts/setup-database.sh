#!/bin/bash
# Database Setup Script for Elemental Genius
# Creates databases and runs initial setup

set -e

ENVIRONMENT=${1:-test}  # Default to test if no environment specified

echo "Setting up database for environment: $ENVIRONMENT"

# Database names based on environment
case "$ENVIRONMENT" in
    "test")
        DB_NAME="elemental_genius_test"
        ;;
    "prod")
        DB_NAME="elemental_genius_prod"
        ;;
    *)
        echo "Invalid environment: $ENVIRONMENT"
        echo "Usage: $0 [test|prod]"
        exit 1
        ;;
esac

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo "Starting PostgreSQL service..."
    sudo systemctl start postgresql
fi

# Create database if it doesn't exist
echo "Creating database: $DB_NAME"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database $DB_NAME already exists"

# Create user if it doesn't exist (Jenkins will provide actual credentials)
sudo -u postgres psql -c "CREATE USER elemental_genius WITH PASSWORD 'temp_password';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO elemental_genius;"

echo "Database setup complete for environment: $ENVIRONMENT"
echo "Remember to update the database password using Jenkins credentials!"