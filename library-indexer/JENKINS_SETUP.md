# Jenkins Setup and Configuration Guide

## Overview
This guide explains how to set up Jenkins for the library-indexer project with automated deployments to test and production environments.

## Prerequisites

### Jenkins Server Requirements
- Jenkins 2.400+ installed
- Java 11 or 17
- Git plugin
- Pipeline plugin
- SSH Agent plugin (for deployments)
- HTML Publisher plugin (for test reports)
- Warnings Next Generation plugin (for code quality)

### Target Server Requirements
- Python 3.11 or 3.x
- SSH access configured
- Systemd for service management
- Sufficient disk space in /opt directory

## Step-by-Step Jenkins Configuration

### 1. Install Required Jenkins Plugins

Go to **Manage Jenkins** → **Plugin Manager** → **Available** and install:
- Pipeline
- Git
- SSH Agent
- HTML Publisher
- Warnings Next Generation
- Coverage Plugin
- JUnit

### 2. Configure Jenkins Credentials

Navigate to **Manage Jenkins** → **Manage Credentials** → **Global** → **Add Credentials**

#### A. GitHub/GitLab Repository Access
- **Kind**: Username with password (or SSH key)
- **ID**: `git-credentials`
- **Username**: Your Git username
- **Password**: Personal access token or password

#### B. Deployment Server SSH Key
- **Kind**: SSH Username with private key
- **ID**: `deploy-ssh-key`
- **Username**: deploy (or your deployment user)
- **Private Key**: Paste your SSH private key

#### C. Deployment Server Connection String
- **Kind**: Secret text
- **ID**: `deploy-server`
- **Secret**: `deploy@your-server.com` (for production)

#### D. Test Server Connection String
- **Kind**: Secret text
- **ID**: `test-server`
- **Secret**: `deploy@test-server.com` (for test environment)

### 3. Create Jenkins Pipeline Job

1. Click **New Item** → Enter name `library-indexer` → Select **Pipeline** → **OK**

2. Configure the pipeline:

#### General Settings
- ✅ **GitHub project**: Enter your repository URL
- ✅ **Build Triggers**: 
  - Poll SCM: `H/5 * * * *` (check every 5 minutes)
  - OR use GitHub webhooks for instant triggers

#### Pipeline Configuration
- **Definition**: Pipeline script from SCM
- **SCM**: Git
- **Repository URL**: Your git repository URL
- **Credentials**: Select `git-credentials`
- **Branch Specifier**: `*/main` for production, `*/develop` for test
- **Script Path**: `Jenkinsfile`

### 4. Configure Environment-Specific Jobs

#### Test Environment Pipeline
Create a separate job `library-indexer-test`:
1. Copy the main job configuration
2. Change branch specifier to `*/develop` or `*/test`
3. Modify the Jenkinsfile or use parameters to deploy to test

#### Production Environment Pipeline
The main job handles production deployments from the `main` branch.

### 5. Set Up GitHub/GitLab Webhook (Optional but Recommended)

#### For GitHub:
1. Go to repository **Settings** → **Webhooks** → **Add webhook**
2. **Payload URL**: `http://your-jenkins-url/github-webhook/`
3. **Content type**: `application/json`
4. **Events**: Select "Push events" and "Pull request events"

#### For GitLab:
1. Go to repository **Settings** → **Integrations**
2. **URL**: `http://your-jenkins-url/project/library-indexer`
3. **Secret Token**: Generate and save in Jenkins
4. **Trigger**: Push events, Merge request events

### 6. Configure Build Parameters (Optional)

Add parameters to your pipeline for flexibility:

```groovy
parameters {
    choice(name: 'ENVIRONMENT', choices: ['test', 'staging', 'production'], description: 'Deployment environment')
    string(name: 'LIMIT', defaultValue: '100', description: 'Number of books to index')
    booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip test execution')
}
```

## Running Your First Build

### Manual Build
1. Go to your `library-indexer` job
2. Click **Build Now**
3. Monitor progress in **Console Output**

### Automatic Builds
- Push to `main` branch → Triggers production pipeline
- Push to `develop` branch → Triggers test pipeline

## Deployment Workflow

### Test Environment
1. Code pushed to `develop` branch
2. Jenkins automatically triggers build
3. Runs tests and quality checks
4. Deploys to test server if all checks pass
5. No manual approval required

### Production Environment
1. Code pushed to `main` branch
2. Jenkins triggers build
3. Runs all tests and quality checks
4. Waits for manual approval (input step)
5. Deploys to production server upon approval

## Monitoring and Maintenance

### View Build History
- Click on job name → **Build History**
- Green = Success, Red = Failed, Yellow = Unstable

### View Test Results
- Click on build number → **Test Result**
- Coverage reports available under **Coverage Report**

### View Console Output
- Click on build number → **Console Output**
- Real-time logs during build execution

### Check Deployment Status
SSH to your servers and check service status:
```bash
# Test environment
ssh deploy@test-server.com
sudo systemctl status library-indexer-test

# Production environment
ssh deploy@prod-server.com
sudo systemctl status library-indexer
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Permission Denied during deployment
**Solution**: Ensure deploy user has sudo privileges for systemctl commands:
```bash
# On target server, add to sudoers:
deploy ALL=(ALL) NOPASSWD: /bin/systemctl
```

#### 2. Python version not found
**Solution**: Install Python 3.11 or update Jenkinsfile to use available version:
```bash
sudo apt-get update
sudo apt-get install python3.11 python3.11-venv
```

#### 3. SSH connection fails
**Solution**: Test SSH key from Jenkins server:
```bash
ssh -i /path/to/key deploy@target-server
```

#### 4. Tests failing in Jenkins but passing locally
**Solution**: Check for environment-specific issues:
- Missing environment variables
- Different Python versions
- Missing system dependencies

### Rollback Procedure

If deployment fails:

#### Automatic Rollback (Production)
The production deployment script automatically rolls back on failure.

#### Manual Rollback
```bash
# SSH to server
ssh deploy@prod-server.com

# List available releases
ls -la /opt/library-indexer/releases/

# Create symlink to previous release
sudo ln -sfn /opt/library-indexer/releases/[PREVIOUS_TIMESTAMP] /opt/library-indexer/current

# Restart service
sudo systemctl restart library-indexer
```

## Security Best Practices

1. **Use SSH keys** instead of passwords for deployments
2. **Restrict Jenkins access** with proper authentication
3. **Use HTTPS** for Jenkins web interface
4. **Rotate credentials** regularly
5. **Limit sudo privileges** for deployment user
6. **Enable audit logging** in Jenkins
7. **Use separate credentials** for test and production

## Backup Strategy

### Jenkins Configuration Backup
```bash
# Backup Jenkins home directory
tar -czf jenkins-backup-$(date +%Y%m%d).tar.gz /var/lib/jenkins/
```

### Application Backup
The deployment script automatically creates backups before each deployment.

## Advanced Configuration

### Multi-branch Pipeline
For more complex workflows, convert to multibranch pipeline:
1. Create **New Item** → **Multibranch Pipeline**
2. Configure branch sources
3. Each branch gets its own pipeline

### Docker Integration
To containerize deployments:
1. Create Dockerfile in repository
2. Modify Jenkinsfile to build and push Docker images
3. Deploy containers instead of direct Python execution

### Notifications
Add notifications to your Jenkinsfile:
```groovy
post {
    success {
        emailext to: 'team@example.com',
                 subject: "Build Successful: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                 body: "The build was successful. Check it at ${env.BUILD_URL}"
    }
    failure {
        emailext to: 'team@example.com',
                 subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                 body: "The build failed. Check console at ${env.BUILD_URL}"
    }
}
```

## Next Steps

1. ✅ Commit and push these files to your repository
2. ✅ Set up Jenkins with the configurations above
3. ✅ Configure credentials in Jenkins
4. ✅ Create the pipeline job
5. ✅ Run your first build
6. ✅ Set up webhooks for automatic builds
7. ✅ Configure notification channels

## Support

For issues or questions:
- Check Jenkins logs: `/var/log/jenkins/jenkins.log`
- Review build console output
- Check systemd logs: `journalctl -u library-indexer`
- Verify network connectivity between Jenkins and target servers