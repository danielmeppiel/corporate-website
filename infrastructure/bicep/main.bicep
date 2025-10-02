// Main Bicep template for Corporate Website Azure deployment
// This orchestrates all resource modules for a cost-optimized architecture

targetScope = 'subscription'

// ============================================================================
// PARAMETERS
// ============================================================================

@description('Environment name (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

@description('Primary Azure region for deployment')
param location string = 'westeurope'

@description('Base name for all resources')
param baseName string = 'corporate-website'

@description('Tags to apply to all resources')
param tags object = {
  Environment: environment
  Application: 'Corporate Website'
  ManagedBy: 'Bicep'
  CostCenter: 'Marketing'
}

// ============================================================================
// VARIABLES
// ============================================================================

var resourceGroupName = 'rg-${baseName}-${environment}'
var resourcePrefix = '${baseName}-${environment}'

// Environment-specific SKU configurations
var skuConfig = {
  dev: {
    staticWebApp: 'Free'
    cosmosDb: 'Serverless'
    functionApp: 'Consumption'
    storage: 'Standard_LRS'
    keyVault: 'Standard'
  }
  staging: {
    staticWebApp: 'Standard'
    cosmosDb: 'Serverless'
    functionApp: 'Consumption'
    storage: 'Standard_LRS'
    keyVault: 'Standard'
  }
  prod: {
    staticWebApp: 'Standard'
    cosmosDb: 'Serverless'
    functionApp: 'Consumption'
    storage: 'Standard_LRS'
    keyVault: 'Standard'
  }
}

// ============================================================================
// RESOURCE GROUP
// ============================================================================

resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

// ============================================================================
// MODULES
// ============================================================================

// Application Insights & Log Analytics (deploy first for monitoring)
module monitoring './modules/appInsights.bicep' = {
  scope: resourceGroup
  name: 'monitoring-deployment'
  params: {
    location: location
    resourcePrefix: resourcePrefix
    tags: tags
  }
}

// Storage Account for audit logs and static assets
module storage './modules/storage.bicep' = {
  scope: resourceGroup
  name: 'storage-deployment'
  params: {
    location: location
    resourcePrefix: resourcePrefix
    storageAccountSku: skuConfig[environment].storage
    tags: tags
  }
}

// Key Vault for secrets management
module keyVault './modules/keyVault.bicep' = {
  scope: resourceGroup
  name: 'keyvault-deployment'
  params: {
    location: location
    resourcePrefix: resourcePrefix
    tags: tags
  }
}

// Cosmos DB for contact forms and data storage
module cosmosDb './modules/cosmosDb.bicep' = {
  scope: resourceGroup
  name: 'cosmosdb-deployment'
  params: {
    location: location
    resourcePrefix: resourcePrefix
    capacityMode: skuConfig[environment].cosmosDb
    tags: tags
  }
}

// Azure Functions for backend API
module functionApp './modules/functionApp.bicep' = {
  scope: resourceGroup
  name: 'function-deployment'
  params: {
    location: location
    resourcePrefix: resourcePrefix
    storageAccountName: storage.outputs.storageAccountName
    appInsightsInstrumentationKey: monitoring.outputs.instrumentationKey
    appInsightsConnectionString: monitoring.outputs.connectionString
    keyVaultName: keyVault.outputs.keyVaultName
    tags: tags
  }
}

// Azure Static Web Apps for frontend hosting
module staticWebApp './modules/staticWebApp.bicep' = {
  scope: resourceGroup
  name: 'staticwebapp-deployment'
  params: {
    location: location
    resourcePrefix: resourcePrefix
    sku: skuConfig[environment].staticWebApp
    functionAppName: functionApp.outputs.functionAppName
    tags: tags
  }
}

// ============================================================================
// KEY VAULT SECRETS
// ============================================================================

// Store Cosmos DB connection string in Key Vault
module cosmosDbSecret './modules/keyVaultSecret.bicep' = {
  scope: resourceGroup
  name: 'cosmosdb-secret-deployment'
  params: {
    keyVaultName: keyVault.outputs.keyVaultName
    secretName: 'CosmosDbConnectionString'
    secretValue: cosmosDb.outputs.connectionString
  }
  dependsOn: [
    keyVault
    cosmosDb
  ]
}

// Store Storage Account connection string in Key Vault
module storageSecret './modules/keyVaultSecret.bicep' = {
  scope: resourceGroup
  name: 'storage-secret-deployment'
  params: {
    keyVaultName: keyVault.outputs.keyVaultName
    secretName: 'StorageAccountConnectionString'
    secretValue: storage.outputs.connectionString
  }
  dependsOn: [
    keyVault
    storage
  ]
}

// ============================================================================
// RBAC ASSIGNMENTS
// ============================================================================

// Grant Function App access to Key Vault secrets
module functionAppKeyVaultAccess './modules/keyVaultRbac.bicep' = {
  scope: resourceGroup
  name: 'function-keyvault-rbac'
  params: {
    keyVaultName: keyVault.outputs.keyVaultName
    principalId: functionApp.outputs.functionAppPrincipalId
    roleDefinitionId: '4633458b-17de-408a-b874-0445c86b69e6' // Key Vault Secrets User
  }
  dependsOn: [
    keyVault
    functionApp
  ]
}

// Grant Function App access to Cosmos DB
module functionAppCosmosDbAccess './modules/cosmosDbRbac.bicep' = {
  scope: resourceGroup
  name: 'function-cosmosdb-rbac'
  params: {
    cosmosDbAccountName: cosmosDb.outputs.accountName
    principalId: functionApp.outputs.functionAppPrincipalId
  }
  dependsOn: [
    cosmosDb
    functionApp
  ]
}

// ============================================================================
// OUTPUTS
// ============================================================================

@description('Resource Group name')
output resourceGroupName string = resourceGroup.name

@description('Static Web App default hostname')
output staticWebAppUrl string = staticWebApp.outputs.defaultHostname

@description('Function App name')
output functionAppName string = functionApp.outputs.functionAppName

@description('Function App hostname')
output functionAppUrl string = functionApp.outputs.functionAppHostname

@description('Application Insights Instrumentation Key')
output appInsightsInstrumentationKey string = monitoring.outputs.instrumentationKey

@description('Cosmos DB Account Name')
output cosmosDbAccountName string = cosmosDb.outputs.accountName

@description('Storage Account Name')
output storageAccountName string = storage.outputs.storageAccountName

@description('Key Vault Name')
output keyVaultName string = keyVault.outputs.keyVaultName

@description('Deployment summary')
output deploymentSummary object = {
  environment: environment
  location: location
  resourceGroup: resourceGroup.name
  frontendUrl: staticWebApp.outputs.defaultHostname
  apiUrl: functionApp.outputs.functionAppHostname
  estimatedMonthlyCost: environment == 'dev' ? '$1-13' : '$26-51'
}
