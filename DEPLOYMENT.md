# Corporate Website - Azure Deployment Guide

This guide provides comprehensive instructions for deploying the Corporate Website to Azure using Infrastructure as Code (Bicep) and CI/CD automation.

## 🎯 Quick Start (5 minutes to deployment)

### Prerequisites
1. **Azure CLI** installed and logged in (`az login`)
2. **Azure subscription** with Contributor permissions
3. **Git** repository cloned locally

### One-Command Deployment
```bash
# Deploy to development environment
./scripts/deploy.sh --environment dev --location eastus

# Deploy to production environment  
./scripts/deploy.sh --environment prod --location eastus
```

That's it! The script handles everything: resource group creation, validation, deployment, and output display.

## 📋 Detailed Deployment Options

### Option 1: Manual Deployment (Recommended for first-time)

#### Step 1: Validate Your Setup
```bash
# Check Azure CLI login status
az account show

# Validate Bicep templates
./scripts/deploy.sh --environment dev --validate-only
```

#### Step 2: Deploy Development Environment
```bash
./scripts/deploy.sh --environment dev --location eastus
```

**What gets deployed:**
- Static Web App (Free tier) - $0/month
- Azure Functions (Consumption) - $5-10/month  
- Cosmos DB (Serverless) - $5-10/month
- Storage Account - $2-5/month
- Key Vault - $3/month
- Application Insights - $0-2/month
- **Total: ~$15-30/month**

#### Step 3: Deploy Production Environment
```bash
./scripts/deploy.sh --environment prod --location eastus
```

**What gets deployed:**
- Static Web App (Standard) - $10/month
- Azure Functions (Consumption) - $15-25/month
- Cosmos DB (Serverless) - $20-40/month
- Storage Account - $5-10/month
- Key Vault - $3/month
- Application Insights - $5-15/month
- Azure CDN - $5-15/month
- **Total: ~$63-118/month**

### Option 2: GitHub Actions CI/CD (Recommended for teams)

#### Step 1: Set Up Azure Service Principal
```bash
# Create service principal for GitHub Actions
az ad sp create-for-rbac --name "github-actions-corporate-website" --role contributor --scopes /subscriptions/{subscription-id} --sdk-auth
```

#### Step 2: Configure GitHub Secrets
In your GitHub repository, add these secrets:
- `AZURE_CLIENT_ID`: From service principal output
- `AZURE_TENANT_ID`: From service principal output  
- `AZURE_SUBSCRIPTION_ID`: Your Azure subscription ID

#### Step 3: Push to Deploy
- **Push to `develop` branch** → Deploys to development
- **Push to `main` branch** → Deploys to production
- **Manual trigger** → Choose environment

The workflow automatically:
- ✅ Builds and validates code
- ✅ Runs security scans
- ✅ Deploys infrastructure
- ✅ Runs post-deployment tests
- ✅ Creates deployment notifications

## 🏗️ Architecture Components

### Frontend: Azure Static Web Apps
- **Purpose**: Hosts the Vite-built static website
- **Features**: Custom domains, SSL, global CDN, GitHub integration
- **Cost Optimization**: Free tier for dev, Standard for prod only

### Backend: Azure Functions (Python)
- **Purpose**: Hosts FastAPI backend with GDPR compliance
- **Features**: Consumption plan, auto-scaling, serverless
- **Cost Optimization**: Pay-per-execution model

### Database: Cosmos DB (Serverless)
- **Purpose**: Stores user data and audit logs with TTL for GDPR
- **Features**: Auto-scaling, global distribution, compliance
- **Cost Optimization**: Serverless billing, automatic data expiration

### Storage: Storage Account
- **Purpose**: Static assets, logs, backups
- **Features**: Lifecycle policies, encryption, retention
- **Cost Optimization**: Automatic tier transitions (Hot→Cool→Archive)

### Security: Key Vault
- **Purpose**: Centralized secrets management
- **Features**: Access policies, audit logging, soft delete
- **Cost Optimization**: Standard tier, minimal operations

### Monitoring: Application Insights + Log Analytics
- **Purpose**: Application monitoring and GDPR audit trails
- **Features**: Custom dashboards, alerts, 7-year retention
- **Cost Optimization**: Free tier for dev, pay-per-GB for prod

### CDN: Azure CDN (Production only)
- **Purpose**: Global content delivery and performance
- **Features**: Caching rules, security headers, compression
- **Cost Optimization**: Only enabled in production

## 🔧 Advanced Configuration

### Custom Resource Groups
```bash
./scripts/deploy.sh --environment prod --resource-group "my-custom-rg"
```

### Different Azure Regions
```bash
./scripts/deploy.sh --environment prod --location "westus2"
```

### Force Deployment (Skip Confirmations)
```bash
./scripts/deploy.sh --environment dev --force
```

### Template Validation Only
```bash
./scripts/deploy.sh --environment prod --validate-only
```

## 📊 Cost Management

### Budget Alerts
The deployment automatically creates:
- Development budget: $50/month
- Production budget: $150/month
- Alert at 80% and 100% of budget

### Cost Tracking Tags
All resources are tagged with:
- `Environment`: dev/prod
- `Project`: corporate-website
- `CostCenter`: IT
- `Owner`: Corporate-Team

### Cost Optimization Features
- **Serverless Billing**: Functions and Cosmos DB
- **Free Tiers**: Static Web Apps (dev), Application Insights
- **Lifecycle Policies**: Storage auto-archiving
- **Auto-scaling**: All compute resources
- **Regional Deployment**: Single region to minimize data transfer

## 🔐 Security & Compliance

### GDPR Compliance Features
- **Data Retention**: Automatic deletion after retention periods
- **Audit Logging**: 7-year retention in Application Insights
- **Data Encryption**: All data encrypted at rest and in transit
- **Access Controls**: Managed identity, Key Vault integration
- **Right to Erasure**: APIs for data deletion
- **Data Portability**: APIs for data export

### Security Headers
The CDN automatically adds:
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`
- `Content-Security-Policy`

### Network Security
- **HTTPS Only**: All traffic encrypted
- **Private Endpoints**: Available for production
- **Access Policies**: Least privilege access
- **IP Restrictions**: Configurable per environment

## 🚨 Troubleshooting

### Common Deployment Issues

#### Issue: "Resource group not found"
```bash
# Solution: Create resource group manually
az group create --name "rg-corporate-website-dev" --location "eastus"
```

#### Issue: "Bicep template validation failed"
```bash
# Solution: Check template syntax
az bicep build --file infrastructure/bicep/main.bicep
```

#### Issue: "Insufficient permissions"
```bash
# Solution: Check Azure role assignments
az role assignment list --assignee $(az account show --query user.name -o tsv)
```

#### Issue: "Static Web App deployment failed"
```bash
# Solution: Check GitHub repository access
# Ensure the repository is public or service principal has access
```

### Deployment Logs
All deployment logs are stored in:
- **Azure**: Activity Log in the resource group
- **GitHub**: Actions tab in the repository
- **Local**: Terminal output during manual deployment

### Recovery Procedures

#### Rollback Deployment
```bash
# List previous deployments
az deployment group list --resource-group "rg-corporate-website-prod"

# Rollback to previous deployment
az deployment group create --resource-group "rg-corporate-website-prod" --template-file "infrastructure/bicep/main.bicep" --parameters "@infrastructure/bicep/parameters/prod.json" --name "rollback-$(date +%Y%m%d)"
```

#### Disaster Recovery
1. **Database**: Automatic backups enabled (4-hour intervals)
2. **Storage**: Geo-redundant replication available
3. **Static Assets**: Stored in version control (GitHub)
4. **Secrets**: Soft delete enabled in Key Vault

## 📈 Monitoring & Maintenance

### Health Checks
- **Frontend**: Automatic availability tests
- **Backend**: Health endpoint monitoring
- **Database**: Connection and performance metrics
- **CDN**: Cache hit ratio and response times

### Performance Monitoring
- **Application Insights**: End-to-end tracing
- **Custom Dashboards**: Business and technical metrics  
- **Alerts**: Performance degradation and errors
- **SLA Monitoring**: 99.9% availability target

### Maintenance Tasks

#### Monthly
- [ ] Review cost management dashboard
- [ ] Check Application Insights for errors
- [ ] Validate backup completion
- [ ] Review security recommendations

#### Quarterly  
- [ ] Update dependency versions
- [ ] Review and test disaster recovery
- [ ] Assess scaling patterns
- [ ] Evaluate new Azure services for cost optimization

#### Annually
- [ ] Conduct security audit
- [ ] Review GDPR compliance procedures
- [ ] Update business continuity plans
- [ ] Renew SSL certificates (if custom)

## 🔗 Useful Links

### Azure Portal Links
- [Resource Groups](https://portal.azure.com/#blade/HubsExtension/BrowseResourceGroups)
- [Cost Management](https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/Menu/overview)
- [Application Insights](https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/microsoft.insights%2Fcomponents)
- [Static Web Apps](https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Web%2FstaticSites)

### Documentation
- [Azure Static Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Functions Python](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-python)
- [Cosmos DB Serverless](https://docs.microsoft.com/en-us/azure/cosmos-db/serverless)
- [Bicep Documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)

### Support
- **Technical Issues**: Create GitHub issue in this repository
- **Azure Support**: [Azure Support Center](https://azure.microsoft.com/en-us/support/)
- **GDPR Questions**: Consult your legal team or data protection officer

---

**Successfully deployed?** 🎉 Your corporate website is now running on Azure with enterprise-grade security, GDPR compliance, and cost optimization!