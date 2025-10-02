# Azure Deployment - Quick Reference

## 🚀 One-Line Deploy

```bash
./scripts/deploy-azure.sh
```

## 📊 Cost Summary

| Environment | Monthly Cost | Services |
|-------------|-------------|----------|
| **Development** | $1-13 | Free tiers + serverless |
| **Production** | $26-51 | Standard tiers + serverless |
| **Total** | $27-64 | Both environments |

## 🏗️ Architecture (30 seconds)

```
Users → Azure Static Web Apps → Azure Functions → Cosmos DB
                                ↓
                           Storage Account (audit logs)
                           Key Vault (secrets)
                           App Insights (monitoring)
```

## ⚡ Quick Commands

### Deploy Infrastructure
```bash
# Development
az deployment sub create \
  --name corporate-website-dev \
  --location westeurope \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters/dev.json

# Production
az deployment sub create \
  --name corporate-website-prod \
  --location westeurope \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters/prod.json
```

### Validate Before Deploy
```bash
az deployment sub validate \
  --location westeurope \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters/prod.json
```

### Preview Changes (What-If)
```bash
az deployment sub what-if \
  --location westeurope \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters/prod.json
```

### Get Deployment Status
```bash
az deployment sub list --output table
```

### Get Outputs
```bash
az deployment sub show \
  --name corporate-website-prod \
  --query properties.outputs
```

## 🔑 Required GitHub Secrets

For CI/CD automation, add these to your repository:

1. **AZURE_CREDENTIALS**
   ```bash
   az ad sp create-for-rbac \
     --name "github-actions-corporate-website" \
     --role Contributor \
     --scopes /subscriptions/{subscription-id} \
     --sdk-auth
   ```

2. **AZURE_STATIC_WEB_APPS_API_TOKEN**
   ```bash
   az staticwebapp secrets list \
     --name swa-corporate-website-prod \
     --resource-group rg-corporate-website-prod \
     --query properties.apiKey -o tsv
   ```

3. **AZURE_SUBSCRIPTION_ID**
   ```bash
   az account show --query id -o tsv
   ```

## 📦 What Gets Deployed

| Resource | Purpose | Cost/Month |
|----------|---------|------------|
| Static Web Apps | Frontend hosting | $0-9 |
| Azure Functions | Backend API | $5-15 |
| Cosmos DB | Database | $5-20 |
| Storage Account | Audit logs | $3-8 |
| Key Vault | Secrets | $0.30 |
| App Insights | Monitoring | $0-2 |

## 🔐 Security Features

- ✅ Managed identities (no credentials in code)
- ✅ RBAC-based access control
- ✅ Key Vault for secrets
- ✅ HTTPS-only endpoints (TLS 1.2+)
- ✅ GDPR compliance (EU regions, audit logs)
- ✅ Automatic encryption (at rest + in transit)

## 📍 Recommended Regions

**GDPR-Compliant:**
- `westeurope` (Netherlands) - **Recommended**
- `northeurope` (Ireland)
- `francecentral` (France)

## 🆘 Troubleshooting

### Not logged in to Azure
```bash
az login
```

### Resource provider not registered
```bash
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.DocumentDB
```

### Check deployment errors
```bash
az deployment sub show \
  --name corporate-website-prod \
  --query properties.error
```

### View deployment operations
```bash
az deployment operation sub list \
  --name corporate-website-prod \
  --query "[?properties.provisioningState=='Failed']"
```

## 📚 Full Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete architecture, cost analysis, diagrams
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Step-by-step deployment guide
- **[infrastructure/README.md](./infrastructure/README.md)** - Bicep templates guide

## 🎯 Next Steps After Deployment

1. ✅ Configure custom domain in Azure Portal
2. ✅ Set up monitoring alerts in Application Insights
3. ✅ Configure GitHub Actions for CI/CD
4. ✅ Review and adjust cost budgets
5. ✅ Test GDPR data export/deletion endpoints

## 💡 Tips

- **Development**: Use free tiers to minimize costs
- **Production**: Enable backups and monitoring
- **Staging**: Use pull request deployments in Static Web Apps (Standard tier)
- **Cost Control**: Set up budget alerts in Azure Cost Management

## 🔄 Update Existing Deployment

```bash
# Preview changes
az deployment sub what-if \
  --location westeurope \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters/prod.json

# Apply changes
az deployment sub create \
  --name corporate-website-prod-update \
  --location westeurope \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters/prod.json
```

## 📊 Monitor Costs

```bash
# View current month costs for resource group
az consumption usage list \
  --start-date $(date -d "1 month ago" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --query "[?resourceGroup=='rg-corporate-website-prod']" \
  --output table
```

---

**Need more details?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete guide.
