# Migration Guide: From Current Deployment to Azure

This guide helps you migrate the Corporate Website from the current SCP-based deployment to Azure's cloud infrastructure.

## Current State vs Azure Target

### Current Deployment
- **Deployment**: Manual SCP to production server
- **Web Server**: Nginx on VM
- **Backend**: Python scripts running on server
- **Database**: File-based or local database
- **SSL**: Manual certificate management
- **Scaling**: Manual server provisioning
- **Monitoring**: Limited or none
- **Cost**: Fixed VM costs + manual management

### Azure Target
- **Deployment**: Automated via GitHub Actions
- **Web Server**: Azure Static Web Apps (automatic CDN)
- **Backend**: Azure Functions (serverless)
- **Database**: Cosmos DB (managed, serverless)
- **SSL**: Automatic with custom domains
- **Scaling**: Automatic, based on demand
- **Monitoring**: Application Insights with dashboards
- **Cost**: Pay-per-use, 65-75% savings

---

## Migration Timeline

**Total Time**: 5-7 days

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1 | 1 day | Infrastructure setup |
| Phase 2 | 1 day | Frontend migration |
| Phase 3 | 2 days | Backend migration |
| Phase 4 | 1 day | Testing & validation |
| Phase 5 | 1 day | DNS cutover |

---

## Phase 1: Infrastructure Setup (Day 1)

### 1.1 Prerequisites

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Set subscription
az account set --subscription "Your Subscription Name"
```

### 1.2 Deploy Azure Infrastructure

```bash
# Run deployment script
cd /path/to/corporate-website
./scripts/deploy-azure.sh

# Select: 1) Development
# Review and confirm deployment
```

**Expected Output**:
- Resource Group created: `rg-corporate-website-dev`
- Static Web App URL: `https://xxx.azurestaticapps.net`
- Function App URL: `https://func-corporate-website-dev.azurewebsites.net`
- Cosmos DB account created
- All monitoring configured

### 1.3 Verify Infrastructure

```bash
# List all resources
RESOURCE_GROUP="rg-corporate-website-dev"
az resource list --resource-group $RESOURCE_GROUP --output table

# Expected resources:
# - Static Web App
# - Function App
# - Cosmos DB Account
# - Storage Account
# - Key Vault
# - Application Insights
# - Log Analytics Workspace
```

**✅ Phase 1 Complete**: Azure infrastructure is ready

---

## Phase 2: Frontend Migration (Day 2)

### 2.1 Build Frontend

```bash
# Install dependencies (if not already done)
npm install

# Build for production
npm run build

# Verify build output
ls -la dist/
```

### 2.2 Get Static Web App Deployment Token

```bash
# Get deployment token
az staticwebapp secrets list \
  --name swa-corporate-website-dev \
  --resource-group rg-corporate-website-dev \
  --query properties.apiKey -o tsv

# Save this token - you'll need it for GitHub Actions
```

### 2.3 Configure GitHub Repository

**Add GitHub Secret**:
1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. New repository secret:
   - Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Value: (paste the token from above)

### 2.4 Deploy Frontend

**Option A: Manual Deployment (for testing)**

```bash
# Install Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Deploy
swa deploy --deployment-token "<your-token>" \
  --app-location . \
  --output-location dist \
  --env production
```

**Option B: Automatic via GitHub Actions**

```bash
# Push to main branch
git add .
git commit -m "feat: migrate to Azure"
git push origin main

# GitHub Actions will automatically deploy
```

### 2.5 Test Frontend

```bash
# Get Static Web App URL
az staticwebapp show \
  --name swa-corporate-website-dev \
  --resource-group rg-corporate-website-dev \
  --query defaultHostname -o tsv

# Open in browser or curl
curl https://<static-web-app-url>
```

**✅ Phase 2 Complete**: Frontend is running on Azure

---

## Phase 3: Backend Migration (Days 3-4)

### 3.1 Prepare Backend Code

The backend needs to be adapted for Azure Functions. The provided `server/function_app.py` already integrates with the existing `contact_handler.py`.

**File structure**:
```
server/
├── function_app.py         # Azure Functions entry point
├── contact_handler.py      # Existing handler (no changes needed)
├── requirements.txt        # Python dependencies
└── host.json              # Azure Functions configuration
```

### 3.2 Migrate Data (if applicable)

If you have existing data in files or a local database:

**Export current data**:
```bash
# On current server
cd /var/www/html
tar -czf data-backup-$(date +%Y%m%d).tar.gz data/
scp data-backup-*.tar.gz user@local-machine:/backups/
```

**Import to Cosmos DB**:
```bash
# Convert data to JSON format
# Upload to Cosmos DB using Azure CLI or SDK

az cosmosdb sql container create \
  --account-name cosmos-corporate-website-dev \
  --database-name corporate-website-db \
  --resource-group rg-corporate-website-dev \
  --name contact-forms \
  --partition-key-path "/id"

# Import data (example with Python script)
python scripts/import-data-to-cosmos.py
```

### 3.3 Configure Environment Variables

```bash
# Add any custom configuration to Function App
az functionapp config appsettings set \
  --name func-corporate-website-dev \
  --resource-group rg-corporate-website-dev \
  --settings \
    "CUSTOM_SETTING=value" \
    "ANOTHER_SETTING=value"
```

### 3.4 Deploy Backend

**Get Function App publish profile**:
```bash
az functionapp deployment list-publishing-profiles \
  --name func-corporate-website-dev \
  --resource-group rg-corporate-website-dev \
  --xml > func-publish-profile.xml

# Copy content and add as GitHub Secret:
# Name: AZURE_FUNCTIONAPP_PUBLISH_PROFILE
# Value: (paste XML content)
```

**Deploy**:
```bash
# GitHub Actions will deploy automatically on push
# Or deploy manually:

cd server
func azure functionapp publish func-corporate-website-dev
```

### 3.5 Test Backend

```bash
# Get Function App URL
FUNC_URL=$(az functionapp show \
  --name func-corporate-website-dev \
  --resource-group rg-corporate-website-dev \
  --query defaultHostName -o tsv)

# Test health endpoint
curl https://$FUNC_URL/api/health

# Expected: {"status":"healthy","service":"corporate-website-api"}

# Test contact form endpoint
curl -X POST https://$FUNC_URL/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "Test message",
    "consent_given": true,
    "csrf_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
  }'
```

**✅ Phase 3 Complete**: Backend is running on Azure

---

## Phase 4: Testing & Validation (Day 5)

### 4.1 Integration Testing

**Test complete flow**:
```bash
# 1. Frontend loads
curl -I https://<static-web-app-url>

# 2. Frontend can call backend
# Open browser developer tools
# Submit a contact form
# Check Network tab for API calls

# 3. Data is stored in Cosmos DB
az cosmosdb sql container query \
  --account-name cosmos-corporate-website-dev \
  --database-name corporate-website-db \
  --resource-group rg-corporate-website-dev \
  --container-name contact-forms \
  --query-text "SELECT * FROM c ORDER BY c._ts DESC OFFSET 0 LIMIT 10"
```

### 4.2 Performance Testing

```bash
# Load test with Apache Bench
ab -n 100 -c 10 https://<static-web-app-url>/

# Test API performance
ab -n 100 -c 10 -p contact-data.json -T application/json \
  https://$FUNC_URL/api/contact
```

### 4.3 Security Testing

- [ ] Verify HTTPS is enforced
- [ ] Check CORS configuration
- [ ] Validate input sanitization
- [ ] Test rate limiting
- [ ] Verify secrets are in Key Vault (not in code)

### 4.4 Monitoring Setup

```bash
# View Application Insights
az monitor app-insights component show \
  --app appi-corporate-website-dev \
  --resource-group rg-corporate-website-dev \
  --query appId -o tsv

# Open in browser
# https://portal.azure.com → Application Insights
```

**Configure alerts**:
- High error rate (>5% in 5 minutes)
- Slow response time (>3s average)
- High costs (>120% of budget)

**✅ Phase 4 Complete**: All tests passing

---

## Phase 5: DNS Cutover (Day 6)

### 5.1 Configure Custom Domain (Optional)

```bash
# Add custom domain to Static Web App
az staticwebapp hostname set \
  --name swa-corporate-website-dev \
  --resource-group rg-corporate-website-dev \
  --hostname www.yourdomain.com

# Azure will provide validation instructions
# Add required DNS records (TXT for validation, CNAME for domain)
```

### 5.2 Update DNS Records

**Current setup**:
```
www.yourdomain.com → A record → 123.456.789.0 (old server)
```

**New setup**:
```
www.yourdomain.com → CNAME → <static-web-app-hostname>
```

**DNS Records**:
```bash
# Get Static Web App hostname
az staticwebapp show \
  --name swa-corporate-website-dev \
  --resource-group rg-corporate-website-dev \
  --query defaultHostname -o tsv

# Update DNS:
# Type: CNAME
# Name: www
# Value: <static-web-app-hostname>
# TTL: 3600
```

### 5.3 SSL Certificate

Azure Static Web Apps **automatically provisions SSL certificates** for custom domains. No manual configuration needed!

**Verify**:
```bash
# Wait 5-10 minutes for DNS propagation
# Then check SSL
curl -I https://www.yourdomain.com
```

### 5.4 Gradual Rollout (Recommended)

**Option 1: Blue-Green Deployment**
1. Keep old server running
2. Update DNS to point to Azure
3. Monitor for 24 hours
4. If issues, revert DNS to old server
5. If successful, decommission old server

**Option 2: Canary Deployment**
1. Route 10% of traffic to Azure (using DNS load balancing)
2. Monitor for issues
3. Gradually increase to 25%, 50%, 100%
4. Decommission old server

### 5.5 Verify Production

```bash
# Check from multiple locations
curl -I https://www.yourdomain.com
curl -I https://www.yourdomain.com/api/health

# Check Application Insights
# Verify traffic is coming through
```

**✅ Phase 5 Complete**: Production migration successful!

---

## Phase 6: Decommission Old Infrastructure

### 6.1 Backup Old Server

```bash
# Create final backup
ssh user@old-server
sudo tar -czf /tmp/final-backup-$(date +%Y%m%d).tar.gz /var/www/html
scp user@old-server:/tmp/final-backup-*.tar.gz /backups/

# Keep backup for 90 days
```

### 6.2 Monitor for Missed Traffic

```bash
# Check old server logs for any traffic
ssh user@old-server
sudo tail -f /var/log/nginx/access.log

# If no traffic for 7 days, safe to decommission
```

### 6.3 Decommission

```bash
# Stop services
ssh user@old-server
sudo systemctl stop nginx

# After 30 days with no issues, delete VM
# Cancel hosting subscription
```

**✅ Migration Complete!**

---

## Rollback Plan

If issues occur during migration, here's how to rollback:

### During Phase 2-4 (Before DNS Change)

**No rollback needed** - old server still serving production traffic.

### After Phase 5 (DNS Changed)

**Quick Rollback** (5 minutes):
```bash
# Revert DNS records to old server
# Update CNAME to point back to old IP
# Wait for DNS propagation (5-60 minutes depending on TTL)
```

**Full Rollback** (if Azure has issues):
```bash
# 1. Revert DNS immediately
# 2. Keep Azure infrastructure running for investigation
# 3. Fix issues in Azure staging environment
# 4. Retry migration when ready
```

---

## Post-Migration Checklist

- [ ] All frontend pages loading correctly
- [ ] All backend API endpoints working
- [ ] Forms submitting successfully
- [ ] Data being stored in Cosmos DB
- [ ] Monitoring configured in Application Insights
- [ ] Cost alerts configured
- [ ] SSL certificate working on custom domain
- [ ] GitHub Actions CI/CD working
- [ ] Team trained on Azure Portal
- [ ] Documentation updated
- [ ] Old server backed up
- [ ] Old server decommissioned (after 30 days)

---

## Cost Comparison

### Before (Current Setup)

| Item | Monthly Cost |
|------|-------------|
| VM (2 CPU, 4GB RAM) | $50-80 |
| SSL Certificate | $10-50 |
| Monitoring | $0 (none) |
| Backup Storage | $5-10 |
| **Total** | **$65-140** |

### After (Azure)

| Item | Monthly Cost |
|------|-------------|
| Static Web Apps (Standard) | $9 |
| Azure Functions (Consumption) | $5-15 |
| Cosmos DB (Serverless) | $5-20 |
| Storage Account | $3-8 |
| Key Vault | $0.30 |
| Application Insights | $0-2 |
| **Total** | **$27-64** |

**Savings**: $38-76/month (45-65%)

**Additional benefits**:
- ✅ Auto-scaling (handle traffic spikes)
- ✅ Built-in CDN (faster global access)
- ✅ Automatic SSL management
- ✅ 99.95% uptime SLA
- ✅ Built-in monitoring and alerts
- ✅ Automated deployments
- ✅ Disaster recovery ready

---

## Troubleshooting Migration Issues

### Frontend not loading

```bash
# Check Static Web App deployment status
az staticwebapp show \
  --name swa-corporate-website-dev \
  --resource-group rg-corporate-website-dev

# Check deployment logs in GitHub Actions
```

### Backend API not responding

```bash
# Check Function App status
az functionapp show \
  --name func-corporate-website-dev \
  --resource-group rg-corporate-website-dev \
  --query state

# View logs
az functionapp log tail \
  --name func-corporate-website-dev \
  --resource-group rg-corporate-website-dev
```

### Data not appearing in Cosmos DB

```bash
# Check Cosmos DB connection
az cosmosdb show \
  --name cosmos-corporate-website-dev \
  --resource-group rg-corporate-website-dev

# Verify connection string in Key Vault
az keyvault secret show \
  --vault-name kv-corporate-website-dev \
  --name CosmosDbConnectionString
```

### SSL certificate not working

```bash
# Check domain validation
az staticwebapp hostname show \
  --name swa-corporate-website-dev \
  --resource-group rg-corporate-website-dev \
  --hostname www.yourdomain.com

# SSL provisioning can take 5-10 minutes
# Check status in Azure Portal
```

---

## Support Resources

- **Azure Support**: https://portal.azure.com → Support + troubleshooting
- **Documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Quick Reference**: [AZURE-QUICKSTART.md](./AZURE-QUICKSTART.md)

---

**Questions?** Create an issue in the GitHub repository or contact the development team.
