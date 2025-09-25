@description('Storage Account for static assets and function app requirements')
param storageAccountName string
param location string = resourceGroup().location
param sku string = 'Standard_LRS'
param accessTier string = 'Hot'
param enableHttpsTrafficOnly bool = true
param enableBlobPublicAccess bool = false
param tags object = {}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  kind: 'StorageV2'
  properties: {
    accessTier: accessTier
    supportsHttpsTrafficOnly: enableHttpsTrafficOnly
    allowBlobPublicAccess: enableBlobPublicAccess
    allowSharedKeyAccess: true
    allowCrossTenantReplication: false
    minimumTlsVersion: 'TLS1_2'
    
    // Network access rules
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
      ipRules: []
      virtualNetworkRules: []
    }
    
    // Encryption configuration
    encryption: {
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
        queue: {
          enabled: true
          keyType: 'Service'
        }
        table: {
          enabled: true
          keyType: 'Service'
        }
      }
      keySource: 'Microsoft.Storage'
      requireInfrastructureEncryption: false
    }
    
    // Advanced security features
    isHnsEnabled: false // Hierarchical namespace not needed
    isSftpEnabled: false
    isLocalUserEnabled: false
    
    // Delete retention for compliance
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

// Blob containers for different content types
resource staticAssetsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/static-assets'
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'Static web assets and media files'
      retention: 'long-term'
    }
  }
}

resource logsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/audit-logs'
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'Application and audit logs'
      retention: '7-years-gdpr'
    }
  }
}

resource backupsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccount.name}/default/backups'
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'Database and configuration backups'
      retention: '1-year'
    }
  }
}

// Lifecycle management for cost optimization and GDPR compliance
resource lifecyclePolicy 'Microsoft.Storage/storageAccounts/managementPolicies@2023-01-01' = {
  name: 'default'
  parent: storageAccount
  properties: {
    policy: {
      rules: [
        {
          name: 'StaticAssetsLifecycle'
          enabled: true
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'static-assets/'
              ]
            }
            actions: {
              baseBlob: {
                tierToCool: {
                  daysAfterModificationGreaterThan: 30
                }
                tierToArchive: {
                  daysAfterModificationGreaterThan: 90
                }
              }
            }
          }
        }
        {
          name: 'AuditLogsRetention'
          enabled: true
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'audit-logs/'
              ]
            }
            actions: {
              baseBlob: {
                tierToCool: {
                  daysAfterModificationGreaterThan: 90
                }
                tierToArchive: {
                  daysAfterModificationGreaterThan: 365
                }
                delete: {
                  daysAfterModificationGreaterThan: 2557 // 7 years for GDPR
                }
              }
            }
          }
        }
        {
          name: 'BackupsRetention'
          enabled: true
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'backups/'
              ]
            }
            actions: {
              baseBlob: {
                tierToCool: {
                  daysAfterModificationGreaterThan: 7
                }
                tierToArchive: {
                  daysAfterModificationGreaterThan: 30
                }
                delete: {
                  daysAfterModificationGreaterThan: 365 // 1 year retention
                }
              }
            }
          }
        }
      ]
    }
  }
}

// Enable diagnostic logging for security monitoring
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'storage-audit-logs'
  scope: storageAccount
  properties: {
    logs: [
      {
        category: 'StorageRead'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
      {
        category: 'StorageWrite'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
      {
        category: 'StorageDelete'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 2557 // 7 years for GDPR compliance
        }
      }
    ]
    metrics: [
      {
        category: 'Transaction'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
      {
        category: 'Capacity'
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

output name string = storageAccount.name
output id string = storageAccount.id
output primaryEndpoints object = storageAccount.properties.primaryEndpoints
output primaryKey string = storageAccount.listKeys().keys[0].value
output connectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
output containers array = [
  {
    name: 'static-assets'
    url: '${storageAccount.properties.primaryEndpoints.blob}static-assets'
  }
  {
    name: 'audit-logs'
    url: '${storageAccount.properties.primaryEndpoints.blob}audit-logs'
  }
  {
    name: 'backups'
    url: '${storageAccount.properties.primaryEndpoints.blob}backups'
  }
]