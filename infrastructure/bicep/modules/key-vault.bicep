@description('Key Vault for secrets management with GDPR compliance and security')
param keyVaultName string
param location string = resourceGroup().location
param sku string = 'standard'
param enablePurgeProtection bool = false
param softDeleteRetentionInDays int = 7
param tags object = {}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: sku
    }
    tenantId: subscription().tenantId
    
    // Access policies (empty initially, will be added by other resources)
    accessPolicies: []
    
    // Security configuration
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    enablePurgeProtection: enablePurgeProtection
    enableRbacAuthorization: false
    enableSoftDelete: true
    softDeleteRetentionInDays: softDeleteRetentionInDays
    
    // Network access configuration
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
      ipRules: []
      virtualNetworkRules: []
    }
    
    // Vault URI
    vaultUri: 'https://${keyVaultName}${environment().suffixes.keyvaultDns}/'
    
    // Create mode
    createMode: 'default'
  }
}

// Create initial secrets structure for the application
resource apiKeyPlaceholder 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: 'api-key-placeholder'
  parent: keyVault
  properties: {
    value: 'placeholder-will-be-replaced'
    attributes: {
      enabled: true
    }
    contentType: 'API Key Placeholder'
  }
}

resource databaseConnectionPlaceholder 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: 'database-connection-placeholder'
  parent: keyVault
  properties: {
    value: 'placeholder-will-be-replaced'
    attributes: {
      enabled: true
    }
    contentType: 'Database Connection String Placeholder'
  }
}

// GDPR compliance secret for audit configuration
resource gdprRetentionConfig 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: 'gdpr-retention-config'
  parent: keyVault
  properties: {
    value: '{"audit_logs_retention_days":2557,"contact_forms_retention_days":1827,"user_sessions_retention_days":30}'
    attributes: {
      enabled: true
    }
    contentType: 'GDPR Data Retention Configuration'
  }
}

// JWT signing key for authentication
resource jwtSigningKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: 'jwt-signing-key'
  parent: keyVault
  properties: {
    value: base64(uniqueString(keyVault.id, 'jwt-signing-key'))
    attributes: {
      enabled: true
    }
    contentType: 'JWT Signing Key'
  }
}

// CSRF protection secret
resource csrfSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  name: 'csrf-secret'
  parent: keyVault
  properties: {
    value: base64(uniqueString(keyVault.id, 'csrf-secret'))
    attributes: {
      enabled: true
    }
    contentType: 'CSRF Protection Secret'
  }
}

// Enable diagnostic logging for security monitoring
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'keyvault-audit-logs'
  scope: keyVault
  properties: {
    logs: [
      {
        category: 'AuditEvent'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 2557 // 7 years for GDPR compliance
        }
      }
      {
        category: 'AzurePolicyEvaluationDetails'
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

output name string = keyVault.name
output id string = keyVault.id
output uri string = keyVault.properties.vaultUri
output tenantId string = keyVault.properties.tenantId