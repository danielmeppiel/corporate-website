# Azure Deployment Guide

This guide provides step-by-step instructions for deploying the Corporate Website to Azure using the provided Infrastructure as Code (Bicep templates).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Deployment Steps](#detailed-deployment-steps)
4. [CI/CD Setup with GitHub Actions](#cicd-setup-with-github-actions)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Cost Management](#cost-management)
9. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Software

1. **Azure CLI** (version 2.50.0 or later)
   ```bash
   # Install on macOS
   brew install azure-cli
   
   # Install on Windows
   winget install Microsoft.AzureCLI
   
   # Install on Linux
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **Azure Subscription**
   - Active Azure subscription with Contributor or Owner role
   - Sufficient quota for required services

3. **Git** and **GitHub Account**
   - For CI/CD integration

4. **Optional: Bicep CLI**
   - Usually included with Azure CLI
   - Verify: `az bicep version`

### Azure Permissions Required

- **Subscription-level**: Contributor or Owner
- **Required resource providers** (auto-registered):
  - Microsoft.Web
  - Microsoft.DocumentDB
  - Microsoft.Storage
  - Microsoft.KeyVault
  - Microsoft.Insights
  - Microsoft.OperationalInsights

### Cost Considerations

Before deploying, review the cost estimates in [ARCHITECTURE.md](./ARCHITECTURE.md):
- **Development**: $1-13/month
- **Production**: $26-51/month

---

## Quick Start

### One-Command Deployment

```bash
# 1. Login to Azure
az login

# 2. Set your subscription (if you have multiple)
az account set --subscription "Your Subscription Name"

# 3. Run the deployment script
./scripts/deploy-azure.sh
```

The script will:
1. ✅ Validate Azure CLI and login status
2. ✅ Prompt for environment selection (dev/prod)
3. ✅ Validate Bicep templates
4. ✅ Show deployment preview (What-If)
5. ✅ Deploy all infrastructure
6. ✅ Display deployment outputs and next steps

**Estimated deployment time**: 10-15 minutes

---

## Detailed Deployment Steps

### Step 1: Authenticate with Azure

```bash
# Login to Azure (opens browser)
az login

# Verify logged in account
az account show

# List available subscriptions
az account list --output table

# Set the desired subscription
az account set --subscription "Your Subscription Name or ID"
```

### Step 2: Review Configuration

Edit the parameter files if needed:

**Development Environment** (`infrastructure/bicep/parameters/dev.json`):
```json
{
  "environment": { "value": "dev" },
  "location": { "value": "westeurope" },
  "baseName": { "value": "corporate-website" }
}
```

**Production Environment** (`infrastructure/bicep/parameters/prod.json`):
```json
{
  "environment": { "value": "prod" },
  "location": { "value": "westeurope" },
  "baseName": { "value": "corporate-website" }
}
```

**Available Azure Regions** (GDPR-compliant):
- `westeurope` (Netherlands) - Recommended
- `northeurope` (Ireland)
- `francecentral` (France)
- `germanywestcentral` (Germany)
- `uksouth` (UK)

### Step 3: Validate Bicep Templates

```bash
# Validate development environment
az deployment sub validate \
  --location westeurope \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters/dev.json

# Validate production environment
az deployment sub validate \
  --location westeurope \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters/prod.json
```

### Step 4: Preview Deployment (What-If)

See what resources will be created **before** deploying:

```bash
# Preview development deployment
az deployment sub what-if \
  --location westeurope \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters/dev.json

# Preview production deployment
az deployment sub what-if \
  --location westeurope \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters/prod.json
```

**Expected resources**:
- ✅ Resource Group
- ✅ Static Web App
- ✅ Function App + App Service Plan
- ✅ Cosmos DB Account + Database + Containers
- ✅ Storage Account + Containers
- ✅ Key Vault
- ✅ Application Insights + Log Analytics Workspace
- ✅ RBAC Role Assignments

### Step 5: Deploy Infrastructure

```bash
# Deploy to development
az deployment sub create \
  --name corporate-website-dev-$(date +%Y%m%d-%H%M%S) \
  --location westeurope \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters/dev.json

# Deploy to production
az deployment sub create \
  --name corporate-website-prod-$(date +%Y%m%d-%H%M%S) \
  --location westeurope \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters/prod.json
```

**Monitor deployment**:
```bash
# Watch deployment status
az deployment sub list --output table

# Get deployment details
az deployment sub show \
  --name corporate-website-dev-TIMESTAMP \
  --query properties.outputs
```

### Step 6: Verify Deployment

```bash
# Get deployment outputs
az deployment sub show \
  --name corporate-website-dev-TIMESTAMP \
  --query properties.outputs

# Expected outputs:
# - resourceGroupName
# - staticWebAppUrl
# - functionAppUrl
# - cosmosDbAccountName
# - storageAccountName
# - keyVaultName
# - appInsightsInstrumentationKey
```

**Test deployed resources**:
```bash
# List all resources in the resource group
RESOURCE_GROUP=$(az deployment sub show \
  --name corporate-website-dev-TIMESTAMP \
  --query properties.outputs.resourceGroupName.value -o tsv)

az resource list --resource-group $RESOURCE_GROUP --output table
```

---

## CI/CD Setup with GitHub Actions

### Automated Deployment with GitHub Actions

The infrastructure includes GitHub Actions workflows for automated deployment.

#### Step 1: Get Azure Credentials

**Option A: Using Azure CLI (Recommended)**

```bash
# Create a service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "github-actions-corporate-website" \
  --role Contributor \
  --scopes /subscriptions/{subscription-id} \
  --sdk-auth

# Save the output JSON - you'll need it for GitHub Secrets
```

**Option B: Using Managed Identity** (Advanced)
- Configure OpenID Connect between GitHub and Azure
- More secure, no long-lived credentials

#### Step 2: Configure GitHub Secrets

Add these secrets to your GitHub repository:

**Repository Settings → Secrets and variables → Actions → New repository secret**

1. **AZURE_CREDENTIALS**
   - Value: The JSON output from service principal creation
   
2. **AZURE_STATIC_WEB_APPS_API_TOKEN**
   ```bash
   # Get the Static Web App deployment token
   az staticwebapp secrets list \
     --name swa-corporate-website-dev \
     --resource-group rg-corporate-website-dev \
     --query properties.apiKey -o tsv
   ```

3. **AZURE_SUBSCRIPTION_ID**
   ```bash
   az account show --query id -o tsv
   ```

4. **AZURE_FUNCTIONAPP_PUBLISH_PROFILE** (Optional)
   ```bash
   # Get Function App publish profile
   az functionapp deployment list-publishing-profiles \
     --name func-corporate-website-dev \
     --resource-group rg-corporate-website-dev \
     --xml
   ```

#### Step 3: Create GitHub Actions Workflow

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  AZURE_FUNCTIONAPP_NAME: func-corporate-website-prod
  AZURE_FUNCTIONAPP_PACKAGE_PATH: 'server'
  PYTHON_VERSION: '3.11'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Build frontend
      run: |
        npm ci
        npm run build
    
    - name: Deploy to Static Web Apps
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: "upload"
        app_location: "/"
        output_location: "dist"
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ env.PYTHON_VERSION }}
    
    - name: Install Function dependencies
      run: |
        cd ${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}
        pip install -r requirements.txt --target=".python_packages/lib/site-packages"
    
    - name: Deploy to Azure Functions
      uses: Azure/functions-action@v1
      with:
        app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
        package: ${{ env.AZURE_FUNCTIONAPP_PACKAGE_PATH }}
        publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
        scm-do-build-during-deployment: false
        enable-oryx-build: false
```

#### Step 4: Trigger Deployment

```bash
# Push to main branch
git add .
git commit -m "feat: add Azure deployment"
git push origin main

# Or trigger manually in GitHub Actions tab
```

---

## Post-Deployment Configuration

### Configure Custom Domain

**For Static Web App**:
```bash
# Add custom domain
az staticwebapp hostname set \
  --name swa-corporate-website-prod \
  --resource-group rg-corporate-website-prod \
  --hostname www.yourdomain.com

# Validate domain ownership (add TXT record to DNS)
# SSL certificate is automatically provisioned
```

### Configure Application Settings

**Add environment-specific configuration**:
```bash
# Add app setting to Function App
az functionapp config appsettings set \
  --name func-corporate-website-prod \
  --resource-group rg-corporate-website-prod \
  --settings "ENABLE_FEATURE_X=true"
```

### Set Up Monitoring Alerts

**Create alert for high error rate**:
```bash
az monitor metrics alert create \
  --name "High Error Rate" \
  --resource-group rg-corporate-website-prod \
  --scopes $(az functionapp show -n func-corporate-website-prod -g rg-corporate-website-prod --query id -o tsv) \
  --condition "avg exceptions/server > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group email-alerts
```

### Configure Backup

**Cosmos DB backups are automatic** with continuous mode (7-day retention).

**Storage Account backups**:
```bash
# Enable soft delete (already configured in Bicep)
# Backups are automatically managed by lifecycle policies
```

---

## Monitoring and Maintenance

### Application Insights Dashboard

Access your monitoring dashboard:
```bash
# Open Application Insights in browser
az monitor app-insights component show \
  --app appi-corporate-website-prod \
  --resource-group rg-corporate-website-prod \
  --query "appId" -o tsv
```

**Navigate to**: https://portal.azure.com → Application Insights → appi-corporate-website-prod

**Key metrics to monitor**:
- Request rate and response time
- Failed requests (5xx errors)
- Dependency calls (Cosmos DB, Storage)
- Custom events (GDPR compliance metrics)

### Cost Monitoring

**View current month costs**:
```bash
# Get cost analysis
az consumption usage list \
  --start-date $(date -d "1 month ago" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --query "[?resourceGroup=='rg-corporate-website-prod']" \
  --output table
```

**Set up budget alerts**:
```bash
az consumption budget create \
  --budget-name monthly-budget \
  --amount 60 \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --end-date $(date -d "+1 year" +%Y-%m-01) \
  --resource-group rg-corporate-website-prod
```

### Regular Maintenance Tasks

**Weekly**:
- [ ] Review Application Insights for errors
- [ ] Check cost reports
- [ ] Verify backup status

**Monthly**:
- [ ] Review and optimize Cosmos DB RU usage
- [ ] Clean up old audit logs (automatic via lifecycle policies)
- [ ] Update dependencies and security patches

**Quarterly**:
- [ ] Disaster recovery drill
- [ ] Security audit
- [ ] Performance optimization review

---

## Troubleshooting

### Common Issues

#### Issue: Deployment fails with "Subscription not registered"

**Solution**:
```bash
# Register required resource providers
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.DocumentDB
az provider register --namespace Microsoft.Storage
az provider register --namespace Microsoft.KeyVault
az provider register --namespace Microsoft.Insights

# Wait for registration (can take 5-10 minutes)
az provider show -n Microsoft.Web --query "registrationState"
```

#### Issue: Function App cannot access Key Vault

**Solution**:
```bash
# Verify managed identity is enabled
az functionapp identity show \
  --name func-corporate-website-prod \
  --resource-group rg-corporate-website-prod

# Verify RBAC assignment
az role assignment list \
  --scope $(az keyvault show -n kv-corporate-website-prod --query id -o tsv) \
  --output table
```

#### Issue: Static Web App deployment fails

**Solution**:
```bash
# Regenerate deployment token
az staticwebapp secrets reset \
  --name swa-corporate-website-prod \
  --resource-group rg-corporate-website-prod

# Update GitHub secret with new token
```

#### Issue: High Cosmos DB costs

**Solution**:
```bash
# Check RU consumption
az cosmosdb sql database throughput show \
  --account-name cosmos-corporate-website-prod \
  --resource-group rg-corporate-website-prod \
  --name corporate-website-db

# Review indexing policies (reduce if needed)
# Consider partitioning strategy optimization
```

### Diagnostic Commands

```bash
# Check Function App logs
az functionapp log tail \
  --name func-corporate-website-prod \
  --resource-group rg-corporate-website-prod

# Check deployment history
az deployment sub list --output table

# Validate Bicep without deploying
az deployment sub validate \
  --location westeurope \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters/prod.json

# Check resource health
az resource list \
  --resource-group rg-corporate-website-prod \
  --query "[].{Name:name, Type:type, Status:provisioningState}" \
  --output table
```

---

## Cost Management

### Cost Optimization Tips

1. **Use Free Tiers**:
   - Development environment uses free tier for Static Web Apps
   - Application Insights free tier: 5GB/month
   - Azure Functions free grant: 1M executions/month

2. **Serverless Services**:
   - Cosmos DB Serverless: Pay per request, no minimum
   - Functions Consumption: Pay per execution
   - No always-on costs

3. **Storage Lifecycle Policies**:
   - Automatic tier transitions (Hot → Cool → Archive)
   - Automatic deletion of old logs
   - Already configured in Bicep templates

4. **Regional Selection**:
   - West Europe is cost-effective for EU deployments
   - Consider North Europe for slight cost savings

5. **Reserved Capacity** (for stable workloads):
   - Consider reserved capacity for production Cosmos DB
   - Can save 30-65% for predictable usage

### Monthly Cost Review Checklist

- [ ] Review Azure Cost Management dashboard
- [ ] Check top 5 cost contributors
- [ ] Verify no unexpected resource creation
- [ ] Review Function execution patterns
- [ ] Check Cosmos DB RU consumption
- [ ] Verify Storage usage trends
- [ ] Update budget forecasts

---

## Rollback Procedures

### Rollback Infrastructure

**Option 1: Redeploy previous version**
```bash
# List previous deployments
az deployment sub list --output table

# Redeploy previous successful deployment
az deployment sub create \
  --name rollback-$(date +%Y%m%d-%H%M%S) \
  --location westeurope \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters/prod.json
```

**Option 2: Manual rollback**
```bash
# Delete resource group (CAUTION: Deletes all resources)
az group delete \
  --name rg-corporate-website-prod \
  --yes --no-wait

# Redeploy from scratch
./scripts/deploy-azure.sh
```

### Rollback Application Code

**Static Web App**:
```bash
# Rollback via Git
git revert <commit-hash>
git push origin main

# GitHub Actions will automatically deploy previous version
```

**Function App**:
```bash
# Swap deployment slots (if configured)
az functionapp deployment slot swap \
  --name func-corporate-website-prod \
  --resource-group rg-corporate-website-prod \
  --slot staging

# Or redeploy previous version
az functionapp deployment source sync \
  --name func-corporate-website-prod \
  --resource-group rg-corporate-website-prod
```

### Restore Data

**Cosmos DB restore**:
```bash
# Point-in-time restore (within 7 days)
az cosmosdb sql database restore \
  --account-name cosmos-corporate-website-prod \
  --resource-group rg-corporate-website-prod \
  --name corporate-website-db \
  --restore-timestamp "2024-01-15T10:30:00Z"
```

**Storage Account restore**:
```bash
# Restore deleted blobs (within soft-delete retention)
az storage blob undelete \
  --account-name <storage-account> \
  --container-name backups \
  --name <blob-name>
```

---

## Security Best Practices

### Regular Security Tasks

1. **Rotate Secrets** (every 90 days):
   ```bash
   # Rotate Cosmos DB keys
   az cosmosdb keys regenerate \
     --name cosmos-corporate-website-prod \
     --resource-group rg-corporate-website-prod \
     --key-kind primary
   
   # Update Key Vault secret
   az keyvault secret set \
     --vault-name kv-corporate-website-prod \
     --name CosmosDbConnectionString \
     --value "<new-connection-string>"
   ```

2. **Review Access Logs**:
   ```bash
   # Check Key Vault access logs
   az monitor activity-log list \
     --resource-group rg-corporate-website-prod \
     --query "[?contains(authorization.action, 'KeyVault')]" \
     --output table
   ```

3. **Enable Security Center** recommendations

4. **Regular vulnerability scanning**

---

## Support and Resources

### Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture overview
- [Azure Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure Static Web Apps Docs](https://learn.microsoft.com/azure/static-web-apps/)
- [Azure Functions Python Guide](https://learn.microsoft.com/azure/azure-functions/functions-reference-python)

### Getting Help

- **Azure Support**: https://portal.azure.com → Support
- **GitHub Issues**: Create an issue in this repository
- **Azure Community**: https://techcommunity.microsoft.com/azure

### Useful Azure CLI Commands

```bash
# List all commands for a resource type
az staticwebapp --help
az functionapp --help
az cosmosdb --help

# Get resource details
az resource show --ids <resource-id>

# Export resource as ARM template
az group export \
  --name rg-corporate-website-prod \
  --output json > exported-template.json
```

---

## Appendix

### Complete Deployment Checklist

**Pre-Deployment**:
- [ ] Azure CLI installed and updated
- [ ] Logged in to Azure (`az login`)
- [ ] Correct subscription selected
- [ ] Bicep templates validated
- [ ] Cost estimate reviewed
- [ ] Deployment preview checked (What-If)

**Deployment**:
- [ ] Infrastructure deployed successfully
- [ ] All resources created (check Azure Portal)
- [ ] RBAC assignments configured
- [ ] Secrets stored in Key Vault

**Post-Deployment**:
- [ ] GitHub Actions secrets configured
- [ ] CI/CD pipeline tested
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring alerts set up
- [ ] Cost budget configured
- [ ] Team access configured (RBAC)

**Testing**:
- [ ] Frontend accessible via Static Web App URL
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] Audit logging functional
- [ ] Application Insights receiving data

**Documentation**:
- [ ] Deployment outputs documented
- [ ] Runbooks updated
- [ ] Team members trained

---

**Need Help?** Refer to the [Troubleshooting](#troubleshooting) section or create a GitHub issue.
