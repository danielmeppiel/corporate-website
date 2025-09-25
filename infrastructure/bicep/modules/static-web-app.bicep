@description('Azure Static Web App for frontend hosting')
param staticWebAppName string
param location string = 'East US 2'
param sku string = 'Free'
param repositoryUrl string = ''
param branch string = 'main'
param buildProperties object = {
  appLocation: '/'
  apiLocation: ''
  outputLocation: 'dist'
}
param appSettings array = []
param tags object = {}

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    // Repository configuration for automatic deployments
    repositoryUrl: repositoryUrl
    branch: branch
    buildProperties: {
      appLocation: buildProperties.appLocation
      apiLocation: buildProperties.apiLocation
      outputLocation: buildProperties.outputLocation
      skipGithubActionWorkflowGeneration: false
    }
    // Enable custom domains and SSL certificates
    allowConfigFileUpdates: true
    // Enterprise features
    enterpriseGradeCdnStatus: sku == 'Standard' ? 'Enabled' : 'Disabled'
    stagingEnvironmentPolicy: sku == 'Standard' ? 'Enabled' : 'Disabled'
  }
}

// Configure application settings
resource staticWebAppSettings 'Microsoft.Web/staticSites/config@2023-01-01' = if (length(appSettings) > 0) {
  name: 'appsettings'
  parent: staticWebApp
  properties: {
    properties: reduce(appSettings, {}, (acc, setting) => union(acc, {
      '${setting.name}': setting.value
    }))
  }
}

// Custom domain configuration (optional parameter)
@description('Custom domain name (optional)')
param customDomainName string = ''

// Custom domain configuration (only if domain name is provided)
resource customDomain 'Microsoft.Web/staticSites/customDomains@2023-01-01' = if (sku == 'Standard' && !empty(customDomainName)) {
  name: customDomainName
  parent: staticWebApp
  properties: {
    domainName: customDomainName
    validationMethod: 'cname-delegation'
  }
}

output name string = staticWebApp.name
output id string = staticWebApp.id
output defaultHostName string = staticWebApp.properties.defaultHostname
output repositoryUrl string = staticWebApp.properties.repositoryUrl
output branch string = staticWebApp.properties.branch
output customDomains array = staticWebApp.properties.customDomains
output keyId string = staticWebApp.properties.repositoryToken