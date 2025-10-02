# Azure Infrastructure as Code

This directory contains Bicep templates for deploying the Corporate Website to Azure.

## 📁 Directory Structure

```
infrastructure/bicep/
├── main.bicep                      # Main orchestration template
├── modules/                        # Modular Bicep files
│   ├── staticWebApp.bicep         # Azure Static Web Apps (Frontend)
│   ├── functionApp.bicep          # Azure Functions (Backend API)
│   ├── cosmosDb.bicep             # Cosmos DB (Database)
│   ├── storage.bicep              # Storage Account (Audit logs)
│   ├── keyVault.bicep             # Key Vault (Secrets)
│   ├── appInsights.bicep          # Application Insights (Monitoring)
│   ├── keyVaultSecret.bicep       # Key Vault secret helper
│   ├── keyVaultRbac.bicep         # Key Vault RBAC helper
│   └── cosmosDbRbac.bicep         # Cosmos DB RBAC helper
└── parameters/                     # Environment configurations
    ├── dev.json                   # Development environment
    └── prod.json                  # Production environment
```

## 🚀 Quick Start

### Prerequisites

- Azure CLI installed
- Azure subscription with Contributor/Owner role
- Logged in to Azure (`az login`)

### Deploy

```bash
# Deploy to development
az deployment sub create \
  --name corporate-website-dev \
  --location westeurope \
  --template-file main.bicep \
  --parameters parameters/dev.json

# Deploy to production
az deployment sub create \
  --name corporate-website-prod \
  --location westeurope \
  --template-file main.bicep \
  --parameters parameters/prod.json
```

Or use the deployment script:

```bash
../../scripts/deploy-azure.sh
```

## 📦 Deployed Resources

| Resource | Purpose | SKU/Tier |
|----------|---------|----------|
| **Static Web App** | Frontend hosting | Free (dev) / Standard (prod) |
| **Function App** | Backend API | Consumption Plan |
| **Cosmos DB** | Database | Serverless |
| **Storage Account** | Audit logs, backups | Standard LRS |
| **Key Vault** | Secrets management | Standard |
| **Application Insights** | Monitoring | Free tier |

## 💰 Cost Estimates

- **Development**: $1-13/month
- **Production**: $26-51/month

See [ARCHITECTURE.md](../../ARCHITECTURE.md) for detailed cost breakdown.

## 🔐 Security Features

- **Managed Identity**: Function App uses system-assigned identity
- **RBAC**: Role-based access control for all services
- **Key Vault**: Centralized secret management
- **HTTPS Only**: All endpoints enforce TLS 1.2+
- **GDPR Compliance**: EU region deployment, audit logs, data retention policies

## 🔧 Customization

### Change Region

Edit the `location` parameter in `parameters/*.json`:

```json
{
  "location": { "value": "northeurope" }
}
```

### Change Environment Name

Edit the `environment` parameter:

```json
{
  "environment": { "value": "staging" }
}
```

### Add Custom Tags

Edit the `tags` parameter:

```json
{
  "tags": {
    "value": {
      "Environment": "Production",
      "CostCenter": "Marketing",
      "Owner": "YourTeam"
    }
  }
}
```

## 📊 Module Details

### main.bicep

Orchestrates all modules and creates:
- Resource Group
- All Azure resources via modules
- RBAC assignments
- Key Vault secrets

### modules/staticWebApp.bicep

Deploys Azure Static Web Apps for frontend hosting with:
- Automatic SSL certificates
- Built-in CDN
- GitHub Actions integration
- Staging environments (Standard tier only)

### modules/functionApp.bicep

Deploys Azure Functions with:
- Python 3.11 runtime
- Consumption plan (serverless)
- System-assigned managed identity
- Application Insights integration
- Environment variables from Key Vault

### modules/cosmosDb.bicep

Deploys Cosmos DB with:
- Serverless capacity mode (pay-per-request)
- Two containers: `contact-forms`, `audit-logs`
- Automatic indexing
- TTL-based data retention (5 years for forms, 7 years for logs)
- Continuous backup (7-day point-in-time restore)

### modules/storage.bicep

Deploys Storage Account with:
- Standard LRS (Locally Redundant Storage)
- Three containers: `audit-logs`, `backups`, `static-assets`
- Lifecycle policies for automatic tiering and deletion
- Soft delete (7-day retention)

### modules/keyVault.bicep

Deploys Key Vault with:
- RBAC-based access control
- Soft delete and purge protection
- Stores connection strings and secrets

### modules/appInsights.bicep

Deploys Application Insights with:
- Log Analytics Workspace
- Free tier (5GB/month ingestion)
- 30-day retention
- GDPR-compliant (IP masking enabled)

## 🧪 Testing

### Validate Before Deployment

```bash
# Validate Bicep syntax and template
az deployment sub validate \
  --location westeurope \
  --template-file main.bicep \
  --parameters parameters/dev.json
```

### Preview Changes (What-If)

```bash
# See what will be created/modified/deleted
az deployment sub what-if \
  --location westeurope \
  --template-file main.bicep \
  --parameters parameters/dev.json
```

## 📝 Best Practices

1. **Use What-If**: Always preview changes before deploying
2. **Version Control**: Keep all Bicep files in Git
3. **Parameter Files**: Use separate files for each environment
4. **Modular Design**: Keep modules focused and reusable
5. **RBAC Over Keys**: Use managed identities instead of access keys
6. **Tagging**: Consistent tagging for cost tracking
7. **Documentation**: Update docs when changing infrastructure

## 🔄 CI/CD Integration

See `.github/workflows/azure-deploy.yml` for automated deployment via GitHub Actions.

Required GitHub Secrets:
- `AZURE_CREDENTIALS` - Service principal credentials
- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - Static Web App deployment token

## 📚 Additional Documentation

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Detailed architecture overview
- [DEPLOYMENT.md](../../DEPLOYMENT.md) - Complete deployment guide
- [Azure Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)

## 🆘 Troubleshooting

### Deployment Fails

```bash
# Check deployment details
az deployment sub show --name corporate-website-dev

# View deployment operations
az deployment operation sub list --name corporate-website-dev
```

### Resource Provider Not Registered

```bash
# Register required providers
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.DocumentDB
az provider register --namespace Microsoft.Storage
```

### Insufficient Permissions

Ensure your account has:
- Contributor or Owner role at subscription level
- User Access Administrator role (for RBAC assignments)

## 📧 Support

For issues or questions:
1. Check [DEPLOYMENT.md](../../DEPLOYMENT.md) troubleshooting section
2. Review Azure deployment logs in the portal
3. Create a GitHub issue with deployment logs
