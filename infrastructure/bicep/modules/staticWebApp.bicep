// Azure Static Web Apps module
// Hosts the Vite-built frontend with automatic CDN and SSL

@description('Azure region for the Static Web App')
param location string

@description('Prefix for resource naming')
param resourcePrefix string

@description('Static Web App SKU (Free or Standard)')
@allowed([
  'Free'
  'Standard'
])
param sku string = 'Free'

@description('Function App name for API integration')
param functionAppName string = ''

@description('Resource tags')
param tags object = {}

// ============================================================================
// RESOURCES
// ============================================================================

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: 'swa-${resourcePrefix}'
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    // Repository configuration (can be configured post-deployment via portal or CLI)
    repositoryUrl: '' // Set during deployment or via GitHub Actions
    branch: 'main'
    
    // Build configuration
    buildProperties: {
      appLocation: '/' // Root of the repository
      apiLocation: '' // No API in static site (using separate Functions)
      outputLocation: 'dist' // Vite build output
    }
    
    // Enable custom domains
    allowConfigFileUpdates: true
    
    // Enable staging environments
    stagingEnvironmentPolicy: sku == 'Standard' ? 'Enabled' : 'Disabled'
  }
}

// Configure linked Function App (if provided)
resource linkedBackend 'Microsoft.Web/staticSites/linkedBackends@2022-09-01' = if (functionAppName != '') {
  parent: staticWebApp
  name: 'backend'
  properties: {
    backendResourceId: resourceId('Microsoft.Web/sites', functionAppName)
    region: location
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

@description('Static Web App resource ID')
output staticWebAppId string = staticWebApp.id

@description('Static Web App name')
output staticWebAppName string = staticWebApp.name

@description('Static Web App default hostname')
output defaultHostname string = staticWebApp.properties.defaultHostname

@description('Static Web App deployment key (for CI/CD)')
output deploymentToken string = staticWebApp.listSecrets().properties.apiKey
