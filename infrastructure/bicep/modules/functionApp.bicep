// Azure Functions module
// Serverless Python backend for FastAPI application

@description('Azure region for the Function App')
param location string

@description('Prefix for resource naming')
param resourcePrefix string

@description('Storage Account name for Function App')
param storageAccountName string

@description('Application Insights instrumentation key')
param appInsightsInstrumentationKey string

@description('Application Insights connection string')
param appInsightsConnectionString string

@description('Key Vault name for secrets')
param keyVaultName string

@description('Resource tags')
param tags object = {}

// ============================================================================
// VARIABLES
// ============================================================================

var functionAppName = 'func-${resourcePrefix}'
var appServicePlanName = 'asp-${resourcePrefix}'

// ============================================================================
// RESOURCES
// ============================================================================

// Consumption Plan (serverless, pay-per-execution)
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'Y1' // Dynamic consumption plan
    tier: 'Dynamic'
  }
  properties: {
    reserved: true // Required for Linux
  }
}

// Function App
resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionAppName
  location: location
  tags: tags
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned' // Managed identity for accessing Key Vault and Cosmos DB
  }
  properties: {
    serverFarmId: appServicePlan.id
    reserved: true // Linux
    
    siteConfig: {
      linuxFxVersion: 'Python|3.11' // Python 3.11 runtime
      
      // CORS configuration
      cors: {
        allowedOrigins: [
          'https://*.azurestaticapps.net' // Allow Static Web Apps
        ]
        supportCredentials: false
      }
      
      // App settings
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};EndpointSuffix=${environment().suffixes.storage};AccountKey=${listKeys(resourceId('Microsoft.Storage/storageAccounts', storageAccountName), '2021-09-01').keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};EndpointSuffix=${environment().suffixes.storage};AccountKey=${listKeys(resourceId('Microsoft.Storage/storageAccounts', storageAccountName), '2021-09-01').keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(functionAppName)
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'python'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsightsInstrumentationKey
        }
        {
          name: 'PYTHON_ISOLATE_WORKER_DEPENDENCIES'
          value: '1'
        }
        // Key Vault reference for Cosmos DB connection string
        {
          name: 'COSMOS_DB_CONNECTION_STRING'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=CosmosDbConnectionString)'
        }
        // Key Vault reference for Storage connection string
        {
          name: 'STORAGE_CONNECTION_STRING'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=StorageAccountConnectionString)'
        }
        // Enable detailed logging
        {
          name: 'FUNCTIONS_WORKER_PROCESS_COUNT'
          value: '1'
        }
        // GDPR compliance settings
        {
          name: 'ENABLE_AUDIT_LOGGING'
          value: 'true'
        }
        {
          name: 'DATA_RETENTION_DAYS'
          value: '1825' // 5 years for contact forms
        }
      ]
      
      // Enable HTTPS only
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      
      // Health check
      healthCheckPath: '/api/health'
    }
    
    httpsOnly: true
    clientAffinityEnabled: false // Not needed for stateless API
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

@description('Function App resource ID')
output functionAppId string = functionApp.id

@description('Function App name')
output functionAppName string = functionApp.name

@description('Function App hostname')
output functionAppHostname string = functionApp.properties.defaultHostName

@description('Function App principal ID (for RBAC)')
output functionAppPrincipalId string = functionApp.identity.principalId

@description('Function App default key (use for deployment only)')
output functionAppKey string = listKeys('${functionApp.id}/host/default', '2022-09-01').functionKeys.default
