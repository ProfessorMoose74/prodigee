# CI/CD Setup for Elemental Genius

## Jenkins Configuration Required

### 1. Credentials Setup in Jenkins
Configure these credentials in Jenkins UI (`Manage Jenkins > Credentials`):

- `db-host`: PostgreSQL server hostname
- `db-user`: Database username (`elemental_genius`)
- `db-password`: Database password (from Passbolt)
- `flask-secret-key`: Flask SECRET_KEY (from Passbolt)
- `redis-url`: Redis connection URL

### 2. Jenkins Plugins Required
- Pipeline Plugin
- Git Plugin
- SSH Agent Plugin
- JUnit Plugin
- Coverage Plugin
- Email Extension Plugin

### 3. SSH Key Setup
Configure SSH keys for deployment to test/prod servers:
```bash
ssh-keygen -t rsa -b 4096 -C "jenkins@elementalgenius.com"
# Add public key to deploy user on target servers
```

## Server Setup

### 1. Run on Jenkins Agent
```bash
chmod +x scripts/install-system-deps.sh
./scripts/install-system-deps.sh
```

### 2. Run on Target Servers (test/prod)
```bash
# Setup database
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh test  # or prod

# Deploy systemd service
chmod +x scripts/deploy-service.sh
./scripts/deploy-service.sh test  # or prod
```

### 3. Environment Files
Create `/opt/elemental-genius/config/.env` on each target server:
```
SECRET_KEY=<from-passbolt>
DATABASE_URL=postgresql://elemental_genius:<password>@localhost/<db_name>
REDIS_URL=redis://localhost:6379/0
FLASK_ENV=production
```

## Pipeline Flow
1. **Checkout**: Clone from GitLab
2. **System Deps**: Install audio/ML dependencies
3. **Python Setup**: Create venv, install requirements
4. **Database**: Run migrations
5. **Tests**: pytest with coverage
6. **Security**: safety + bandit scans
7. **Deploy Test**: Auto-deploy to test environment
8. **Deploy Prod**: Manual approval required

## Manual Steps After Setup
1. Install Jenkins plugins listed above
2. Configure credentials in Jenkins UI
3. Set up SSH keys for deployment
4. Create environment files on target servers
5. Update hostnames in Jenkinsfile once determined