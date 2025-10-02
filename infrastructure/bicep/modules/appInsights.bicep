// Application Insights module
// Monitoring and diagnostics for all services

@description('Azure region for monitoring resources')
param location string

@description('Prefix for resource naming')
param resourcePrefix string

@description('Resource tags')
param tags object = {}

// ============================================================================
// VARIABLES
// ============================================================================

var logAnalyticsWorkspaceName = 'log-${resourcePrefix}'
var appInsightsName = 'appi-${resourcePrefix}'

// ============================================================================
// RESOURCES
// ============================================================================

// Log Analytics Workspace (required for Application Insights)
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30 // Free tier allows up to 31 days
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: 5 // Free tier: 5GB/month = ~0.16GB/day
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    
    // Free tier ingestion limit
    IngestionMode: 'LogAnalytics'
    
    // Sampling to stay within free tier
    SamplingPercentage: 100 // Can reduce to 20-50% if needed
    
    // Disable Application Insights IP address collection for GDPR
    DisableIpMasking: false
    
    // Retention
    RetentionInDays: 30
    
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

@description('Log Analytics Workspace ID')
output workspaceId string = logAnalyticsWorkspace.id

@description('Application Insights resource ID')
output appInsightsId string = appInsights.id

@description('Application Insights name')
output appInsightsName string = appInsights.name

@description('Application Insights Instrumentation Key')
output instrumentationKey string = appInsights.properties.InstrumentationKey

@description('Application Insights Connection String')
output connectionString string = appInsights.properties.ConnectionString
