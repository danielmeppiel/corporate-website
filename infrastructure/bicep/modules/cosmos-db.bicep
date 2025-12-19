@description('Cosmos DB for user data and audit logs with GDPR compliance')
param accountName string
param location string = resourceGroup().location
param databaseName string
param containers array = []
param consistencyLevel string = 'Session'
param enableServerless bool = true
param logAnalyticsWorkspaceId string = ''
param tags object = {}

// Cosmos DB Account with security and compliance features
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-11-15' = {
  name: accountName
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    // Multi-region configuration
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    
    // Consistency configuration
    consistencyPolicy: {
      defaultConsistencyLevel: consistencyLevel
      maxIntervalInSeconds: 86400
      maxStalenessPrefix: 1000000
    }
    
    // Capacity configuration
    capabilities: enableServerless ? [
      {
        name: 'EnableServerless'
      }
    ] : []
    
    // Security configuration
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    enableFreeTier: false
    
    // Network access
    publicNetworkAccess: 'Enabled'
    ipRules: []
    isVirtualNetworkFilterEnabled: false
    
    // Backup configuration for GDPR compliance
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240 // 4 hours
        backupRetentionIntervalInHours: 8760 // 1 year
        backupStorageRedundancy: 'Local'
      }
    }
    
    // Analytical storage (disabled for cost optimization)
    enableAnalyticalStorage: false
    
    // Security features
    disableKeyBasedMetadataWriteAccess: false
    enablePartitionMerge: false
    minimalTlsVersion: 'Tls12'
    
    // GDPR and compliance features
    disableLocalAuth: false // Enable for Key Vault integration
  }
}

// Create database
resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-11-15' = {
  name: databaseName
  parent: cosmosAccount
  properties: {
    resource: {
      id: databaseName
    }
    options: enableServerless ? {} : {
      throughput: 400
    }
  }
}

// Create containers with TTL for GDPR compliance
resource cosmosContainers 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15' = [for container in containers: {
  name: container.name
  parent: database
  properties: {
    resource: {
      id: container.name
      partitionKey: {
        paths: [
          container.partitionKey
        ]
        kind: 'Hash'
      }
      // Configure TTL for automatic data expiration (GDPR compliance)
      defaultTtl: contains(container, 'ttl') ? container.ttl : -1
      // Indexing policy for performance
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
      // Unique key policy for data integrity
      uniqueKeyPolicy: {
        uniqueKeys: []
      }
      // Conflict resolution for multi-region scenarios
      conflictResolutionPolicy: {
        mode: 'LastWriterWins'
        conflictResolutionPath: '/_ts'
      }
    }
    options: enableServerless || contains(container, 'throughputMode') && container.throughputMode == 'serverless' ? {} : {
      throughput: contains(container, 'throughput') ? container.throughput : 400
    }
  }
}]

// Enable diagnostic logging for audit trails (GDPR requirement)
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsWorkspaceId)) {
  name: 'audit-logs'
  scope: cosmosAccount
  properties: {
    logs: [
      {
        category: 'DataPlaneRequests'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 2557 // 7 years for GDPR compliance
        }
      }
      {
        category: 'ControlPlaneRequests'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 2557
        }
      }
      {
        category: 'QueryRuntimeStatistics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
      {
        category: 'PartitionKeyStatistics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
    ]
    metrics: [
      {
        category: 'Requests'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
    ]
    workspaceId: logAnalyticsWorkspaceId
  }
}

output name string = cosmosAccount.name
output id string = cosmosAccount.id
output endpoint string = cosmosAccount.properties.documentEndpoint
output primaryKey string = cosmosAccount.listKeys().primaryMasterKey
output connectionString string = 'AccountEndpoint=${cosmosAccount.properties.documentEndpoint};AccountKey=${cosmosAccount.listKeys().primaryMasterKey};'
output databaseName string = database.name
output containers array = [for (container, i) in containers: {
  name: cosmosContainers[i].name
  partitionKey: container.partitionKey
  ttl: contains(container, 'ttl') ? container.ttl : -1
}]