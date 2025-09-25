@description('Azure Functions for Python FastAPI backend')
param functionAppName string
param location string = resourceGroup().location
param storageAccountName string
param appInsightsConnectionString string
param keyVaultName string
param runtime string = 'python'
param runtimeVersion string = '3.11'
param sku string = 'Y1'
param appSettings array = []
param tags object = {}

// Get reference to existing storage account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: storageAccountName
}

// Create consumption plan for cost optimization
resource hostingPlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: 'plan-${functionAppName}'
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku == 'Y1' ? 'Dynamic' : 'Standard'
  }
  kind: 'functionapp'
  properties: {
    reserved: true // Required for Linux/Python
  }
}

// Create Function App
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  tags: tags
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: hostingPlan.id
    reserved: true
    siteConfig: {
      appSettings: concat([
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
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
          value: runtime
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
        {
          name: 'PYTHON_VERSION'
          value: runtimeVersion
        }
        // Security headers
        {
          name: 'WEBSITE_HTTPLOGGING_RETENTION_DAYS'
          value: '7'
        }
        {
          name: 'WEBSITE_ENABLE_SYNC_UPDATE_SITE'
          value: 'true'
        }
        // CORS configuration for Static Web App
        {
          name: 'WEBSITE_CORS_ALLOWED_ORIGINS'
          value: '*'
        }
        {
          name: 'WEBSITE_CORS_SUPPORT_CREDENTIALS'
          value: 'false'
        }
      ], appSettings)
      linuxFxVersion: 'Python|${runtimeVersion}'
      use32BitWorkerProcess: false
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      http20Enabled: true
      alwaysOn: sku != 'Y1' // Always on not supported on consumption plan
      cors: {
        allowedOrigins: [
          '*'
        ]
        supportCredentials: false
      }
      // Health check configuration
      healthCheckPath: '/api/health'
    }
    httpsOnly: true
    clientAffinityEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

// Grant Function App access to Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  name: 'add'
  parent: keyVault
  properties: {
    accessPolicies: [
      {
        tenantId: functionApp.identity.tenantId
        objectId: functionApp.identity.principalId
        permissions: {
          secrets: [
            'get'
            'list'
          ]
        }
      }
    ]
  }
}

// Enable diagnostic logs for monitoring and compliance
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'audit-logs'
  scope: functionApp
  properties: {
    logs: [
      {
        category: 'FunctionAppLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
    ]
    workspaceId: '/subscriptions/${subscription().subscriptionId}/resourceGroups/${resourceGroup().name}/providers/Microsoft.OperationalInsights/workspaces/law-corporate-website-${uniqueString(resourceGroup().id)}'
  }
}

output name string = functionApp.name
output id string = functionApp.id
output defaultHostName string = functionApp.properties.defaultHostName
output principalId string = functionApp.identity.principalId
output tenantId string = functionApp.identity.tenantId
output planId string = hostingPlan.id