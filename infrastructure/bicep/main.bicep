@description('Main deployment template for Corporate Website')
param environment string = 'dev'
param location string = resourceGroup().location
param projectName string = 'corporate-website'
param deploymentTimestamp string = utcNow('yyyy-MM-dd-HH-mm-ss')

// Resource naming convention
var resourceSuffix = '${projectName}-${environment}'
var uniqueSuffix = substring(uniqueString(resourceGroup().id), 0, 6)

// Shared tags for all resources
var commonTags = {
  Environment: environment
  Project: projectName
  DeployedBy: 'Bicep'
  DeploymentTimestamp: deploymentTimestamp
  CostCenter: 'IT'
  Owner: 'Corporate-Team'
}

// Load environment-specific parameters
var environmentConfig = loadJsonContent('parameters/${environment}.json')

// Deploy Log Analytics Workspace first (required by other services)
module logAnalytics 'modules/monitoring.bicep' = {
  name: 'logAnalytics-${deploymentTimestamp}'
  params: {
    workspaceName: 'law-${resourceSuffix}-${uniqueSuffix}'
    location: location
    sku: environmentConfig.logAnalytics.sku
    retentionInDays: environmentConfig.logAnalytics.retentionInDays
    tags: commonTags
  }
}

// Deploy Application Insights
module appInsights 'modules/monitoring.bicep' = {
  name: 'appInsights-${deploymentTimestamp}'
  params: {
    appInsightsName: 'ai-${resourceSuffix}-${uniqueSuffix}'
    workspaceResourceId: logAnalytics.outputs.workspaceId
    location: location
    applicationType: 'web'
    tags: commonTags
  }
}

// Deploy Storage Account for static assets and function app
module storage 'modules/storage.bicep' = {
  name: 'storage-${deploymentTimestamp}'
  params: {
    storageAccountName: 'st${replace(resourceSuffix, '-', '')}${uniqueSuffix}'
    location: location
    sku: environmentConfig.storage.sku
    accessTier: environmentConfig.storage.accessTier
    enableHttpsTrafficOnly: true
    enableBlobPublicAccess: false
    tags: commonTags
  }
}

// Deploy Key Vault for secrets management
module keyVault 'modules/key-vault.bicep' = {
  name: 'keyVault-${deploymentTimestamp}'
  params: {
    keyVaultName: 'kv-${resourceSuffix}-${uniqueSuffix}'
    location: location
    sku: environmentConfig.keyVault.sku
    enablePurgeProtection: environment == 'prod'
    softDeleteRetentionInDays: environmentConfig.keyVault.softDeleteRetentionInDays
    tags: commonTags
  }
}

// Deploy Cosmos DB for user data and audit logs
module cosmosDb 'modules/cosmos-db.bicep' = {
  name: 'cosmosDb-${deploymentTimestamp}'
  params: {
    accountName: 'cosmos-${resourceSuffix}-${uniqueSuffix}'
    location: location
    databaseName: 'corporate-website'
    containers: [
      {
        name: 'users'
        partitionKey: '/id'
        throughput: environmentConfig.cosmosDb.throughput
      }
      {
        name: 'audit-logs'
        partitionKey: '/userId'
        throughput: environmentConfig.cosmosDb.throughput
        ttl: 2557440 // 7 years in seconds for GDPR compliance
      }
      {
        name: 'contact-forms'
        partitionKey: '/submissionId'
        throughputMode: 'serverless'
        ttl: 157680000 // 5 years in seconds for GDPR compliance
      }
    ]
    consistencyLevel: environmentConfig.cosmosDb.consistencyLevel
    enableServerless: environmentConfig.cosmosDb.enableServerless
    tags: commonTags
  }
}

// Deploy Azure Functions for backend API
module functionApp 'modules/function-app.bicep' = {
  name: 'functionApp-${deploymentTimestamp}'
  params: {
    functionAppName: 'func-${resourceSuffix}-${uniqueSuffix}'
    location: location
    storageAccountName: storage.outputs.name
    appInsightsConnectionString: appInsights.outputs.connectionString
    keyVaultName: keyVault.outputs.name
    runtime: 'python'
    runtimeVersion: '3.11'
    sku: environmentConfig.functionApp.sku
    tags: commonTags
    appSettings: [
      {
        name: 'COSMOS_DB_ENDPOINT'
        value: cosmosDb.outputs.endpoint
      }
      {
        name: 'COSMOS_DB_KEY'
        value: '@Microsoft.KeyVault(VaultName=${keyVault.outputs.name};SecretName=cosmos-db-key)'
      }
      {
        name: 'ENVIRONMENT'
        value: environment
      }
      {
        name: 'GDPR_RETENTION_AUDIT_DAYS'
        value: '2557'
      }
      {
        name: 'GDPR_RETENTION_CONTACT_DAYS'
        value: '1827'
      }
    ]
  }
  dependsOn: [
    storage
    appInsights
    keyVault
    cosmosDb
  ]
}

// Deploy Static Web App for frontend
module staticWebApp 'modules/static-web-app.bicep' = {
  name: 'staticWebApp-${deploymentTimestamp}'
  params: {
    staticWebAppName: 'swa-${resourceSuffix}-${uniqueSuffix}'
    location: environment == 'prod' ? 'East US 2' : 'Central US' // Static Web Apps have limited regions
    sku: environmentConfig.staticWebApp.sku
    repositoryUrl: 'https://github.com/danielmeppiel/corporate-website'
    branch: environment == 'prod' ? 'main' : 'develop'
    buildProperties: {
      appLocation: '/'
      apiLocation: ''
      outputLocation: 'dist'
    }
    tags: commonTags
    appSettings: [
      {
        name: 'API_BASE_URL'
        value: functionApp.outputs.defaultHostName
      }
      {
        name: 'ENVIRONMENT'
        value: environment
      }
      {
        name: 'APPLICATION_INSIGHTS_CONNECTION_STRING'
        value: appInsights.outputs.connectionString
      }
    ]
  }
  dependsOn: [
    functionApp
    appInsights
  ]
}

// Deploy CDN for production environment only
module cdn 'modules/cdn.bicep' = if (environment == 'prod') {
  name: 'cdn-${deploymentTimestamp}'
  params: {
    cdnProfileName: 'cdn-${resourceSuffix}-${uniqueSuffix}'
    location: 'Global'
    sku: environmentConfig.cdn.sku
    endpointName: 'corporate-website-${uniqueSuffix}'
    originHostName: staticWebApp.outputs.defaultHostName
    tags: commonTags
  }
  dependsOn: [
    staticWebApp
  ]
}

// Store secrets in Key Vault
resource cosmosDbKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.outputs.name}/cosmos-db-key'
  properties: {
    value: cosmosDb.outputs.primaryKey
    attributes: {
      enabled: true
    }
    contentType: 'Cosmos DB Primary Key'
  }
  dependsOn: [
    keyVault
    cosmosDb
  ]
}

resource appInsightsKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: '${keyVault.outputs.name}/app-insights-key'
  properties: {
    value: appInsights.outputs.instrumentationKey
    attributes: {
      enabled: true
    }
    contentType: 'Application Insights Instrumentation Key'
  }
  dependsOn: [
    keyVault
    appInsights
  ]
}

// Outputs for use in CI/CD pipelines and other deployments
output resourceGroupName string = resourceGroup().name
output staticWebAppName string = staticWebApp.outputs.name
output staticWebAppUrl string = staticWebApp.outputs.defaultHostName
output functionAppName string = functionApp.outputs.name
output functionAppUrl string = 'https://${functionApp.outputs.defaultHostName}'
output cosmosDbEndpoint string = cosmosDb.outputs.endpoint
output keyVaultName string = keyVault.outputs.name
output keyVaultUri string = keyVault.outputs.uri
output storageAccountName string = storage.outputs.name
output applicationInsightsName string = appInsights.outputs.name
output cdnEndpointUrl string = environment == 'prod' ? cdn.outputs.endpointUrl : ''

// Cost tracking outputs
output estimatedMonthlyCost object = {
  environment: environment
  staticWebApp: environmentConfig.staticWebApp.sku == 'Free' ? 0 : 10
  functionApp: environment == 'prod' ? 25 : 10
  cosmosDb: environment == 'prod' ? 30 : 10
  storage: environment == 'prod' ? 10 : 5
  keyVault: 3
  monitoring: environment == 'prod' ? 15 : 2
  cdn: environment == 'prod' ? 10 : 0
  totalEstimated: environment == 'prod' ? 103 : 30
  currency: 'USD'
}