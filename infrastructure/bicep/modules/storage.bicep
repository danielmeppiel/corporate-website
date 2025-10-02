// Storage Account module
// For audit logs, backups, and static assets

@description('Azure region for Storage Account')
param location string

@description('Prefix for resource naming')
param resourcePrefix string

@description('Storage Account SKU')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_ZRS'
])
param storageAccountSku string = 'Standard_LRS'

@description('Resource tags')
param tags object = {}

// ============================================================================
// VARIABLES
// ============================================================================

// Storage account names must be lowercase, no hyphens, 3-24 chars
var storageAccountName = 'st${replace(resourcePrefix, '-', '')}${uniqueString(resourceGroup().id)}'

// ============================================================================
// RESOURCES
// ============================================================================

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: take(storageAccountName, 24) // Ensure max 24 chars
  location: location
  tags: tags
  sku: {
    name: storageAccountSku
  }
  kind: 'StorageV2'
  properties: {
    // Security
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    
    // Encryption
    encryption: {
      services: {
        blob: {
          enabled: true
        }
        file: {
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
    
    // Access tier
    accessTier: 'Hot'
    
    // Network rules
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow' // Can be changed to 'Deny' for VNet integration
    }
  }
}

// Blob service configuration
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    // CORS for web access
    cors: {
      corsRules: [
        {
          allowedOrigins: [
            'https://*.azurestaticapps.net'
          ]
          allowedMethods: [
            'GET'
            'HEAD'
            'OPTIONS'
          ]
          allowedHeaders: [
            '*'
          ]
          exposedHeaders: [
            '*'
          ]
          maxAgeInSeconds: 3600
        }
      ]
    }
    
    // Delete retention policy
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    
    // Container delete retention
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

// Container for audit logs (append blobs)
resource auditLogsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'audit-logs'
  properties: {
    publicAccess: 'None'
  }
}

// Container for backups
resource backupsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'backups'
  properties: {
    publicAccess: 'None'
  }
}

// Container for static assets
resource staticAssetsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'static-assets'
  properties: {
    publicAccess: 'None'
  }
}

// Lifecycle management policy
resource lifecyclePolicy 'Microsoft.Storage/storageAccounts/managementPolicies@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    policy: {
      rules: [
        {
          enabled: true
          name: 'move-old-logs-to-cool'
          type: 'Lifecycle'
          definition: {
            actions: {
              baseBlob: {
                tierToCool: {
                  daysAfterModificationGreaterThan: 30
                }
                tierToArchive: {
                  daysAfterModificationGreaterThan: 90
                }
                delete: {
                  daysAfterModificationGreaterThan: 2555 // 7 years
                }
              }
            }
            filters: {
              blobTypes: [
                'appendBlob'
                'blockBlob'
              ]
              prefixMatch: [
                'audit-logs/'
              ]
            }
          }
        }
        {
          enabled: true
          name: 'delete-old-backups'
          type: 'Lifecycle'
          definition: {
            actions: {
              baseBlob: {
                delete: {
                  daysAfterModificationGreaterThan: 90 // Keep backups for 90 days
                }
              }
            }
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                'backups/'
              ]
            }
          }
        }
      ]
    }
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

@description('Storage Account resource ID')
output storageAccountId string = storageAccount.id

@description('Storage Account name')
output storageAccountName string = storageAccount.name

@description('Storage Account primary endpoints')
output primaryEndpoints object = storageAccount.properties.primaryEndpoints

@description('Storage Account connection string')
output connectionString string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
