@description('Log Analytics Workspace and Application Insights for monitoring and compliance')
param workspaceName string = ''
param appInsightsName string = ''
param location string = resourceGroup().location
param sku string = 'pergb2018'
param retentionInDays int = 30
param workspaceResourceId string = ''
param applicationType string = 'web'
param tags object = {}

// Log Analytics Workspace for centralized logging
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = if (!empty(workspaceName)) {
  name: workspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: sku
    }
    retentionInDays: retentionInDays
    workspaceCapping: {
      dailyQuotaGb: sku == 'pergb2018' ? 1 : -1 // 1GB daily cap for cost control
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    forceCmkForQuery: false
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
      disableLocalAuth: false
    }
  }
}

// Application Insights for application monitoring
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = if (!empty(appInsightsName)) {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: applicationType
    WorkspaceResourceId: !empty(workspaceResourceId) ? workspaceResourceId : logAnalyticsWorkspace.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    
    // Sampling configuration for cost optimization
    SamplingPercentage: 100
    
    // Data retention for GDPR compliance
    RetentionInDays: 90
    
    // Disable IP masking for audit trails (ensure compliance with local regulations)
    DisableIpMasking: false
    
    // Immediate purge for GDPR right to erasure
    ImmediatePurgeDataOn30Days: false
  }
}

// Custom tables for GDPR audit logging
resource customAuditTable 'Microsoft.OperationalInsights/workspaces/tables@2022-10-01' = if (!empty(workspaceName)) {
  name: 'GDPRAuditLogs_CL'
  parent: logAnalyticsWorkspace
  properties: {
    schema: {
      name: 'GDPRAuditLogs_CL'
      description: 'Custom table for GDPR compliance audit logs'
      columns: [
        {
          name: 'TimeGenerated'
          type: 'datetime'
          description: 'Timestamp of the audit event'
        }
        {
          name: 'EventType_s'
          type: 'string'
          description: 'Type of audit event'
        }
        {
          name: 'UserId_s'
          type: 'string'
          description: 'Hashed user identifier'
        }
        {
          name: 'IPAddressHash_s'
          type: 'string'
          description: 'Hashed IP address for privacy'
        }
        {
          name: 'UserAgent_s'
          type: 'string'
          description: 'Sanitized user agent string'
        }
        {
          name: 'EventData_s'
          type: 'string'
          description: 'JSON event data'
        }
        {
          name: 'ConsentStatus_s'
          type: 'string'
          description: 'User consent status'
        }
        {
          name: 'RetentionCategory_s'
          type: 'string'
          description: 'Data retention category'
        }
        {
          name: 'Computer'
          type: 'string'
          description: 'Source computer/service'
        }
      ]
    }
    retentionInDays: 2557 // 7 years for GDPR compliance
  }
}

// Data retention workbook for compliance monitoring
resource dataRetentionWorkbook 'Microsoft.Insights/workbooks@2023-06-01' = if (!empty(workspaceName)) {
  name: guid('data-retention-workbook', resourceGroup().id)
  location: location
  tags: tags
  kind: 'shared'
  properties: {
    displayName: 'GDPR Data Retention Monitoring'
    serializedData: '{"version":"Notebook/1.0","items":[{"type":1,"content":{"json":"# GDPR Data Retention Monitoring\\n\\nThis workbook helps monitor data retention policies and compliance with GDPR requirements.\\n\\n## Key Metrics\\n- Data retention by category\\n- Audit log completeness\\n- Data subject request tracking"}},{"type":3,"content":{"version":"KqlItem/1.0","query":"GDPRAuditLogs_CL\\n| where TimeGenerated >= ago(30d)\\n| summarize count() by EventType_s, bin(TimeGenerated, 1d)\\n| render timechart","size":0,"title":"Audit Events Over Time"}}],"styleSettings":{},"$schema":"https://github.com/Microsoft/Application-Insights-Workbooks/blob/master/schema/workbook.json"}'
    category: 'workbook'
    sourceId: logAnalyticsWorkspace.id
  }
}

// Alert rules for GDPR compliance monitoring
resource gdprComplianceAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = if (!empty(workspaceName)) {
  name: 'GDPR-Compliance-Alert'
  location: location
  tags: tags
  properties: {
    displayName: 'GDPR Compliance Alert'
    description: 'Alert when GDPR data retention policies may be violated'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT1H'
    windowSize: 'PT1H'
    scopes: [
      logAnalyticsWorkspace.id
    ]
    criteria: {
      allOf: [
        {
          query: 'GDPRAuditLogs_CL | where TimeGenerated < ago(2557d) | where RetentionCategory_s == "audit_logs" | count'
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: []
      customProperties: {
        'GDPR Violation': 'Data older than 7 years detected in audit logs'
      }
    }
  }
}

output workspaceId string = !empty(workspaceName) ? logAnalyticsWorkspace.id : ''
output workspaceName string = !empty(workspaceName) ? logAnalyticsWorkspace.name : ''
output applicationInsightsId string = !empty(appInsightsName) ? applicationInsights.id : ''
output applicationInsightsName string = !empty(appInsightsName) ? applicationInsights.name : ''
output connectionString string = !empty(appInsightsName) ? applicationInsights.properties.ConnectionString : ''
output instrumentationKey string = !empty(appInsightsName) ? applicationInsights.properties.InstrumentationKey : ''
output appId string = !empty(appInsightsName) ? applicationInsights.properties.AppId : ''