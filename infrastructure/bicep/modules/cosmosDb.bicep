// Cosmos DB module
// Serverless NoSQL database for contact forms and data storage

@description('Azure region for Cosmos DB')
param location string

@description('Prefix for resource naming')
param resourcePrefix string

@description('Capacity mode (Serverless or Provisioned)')
@allowed([
  'Serverless'
  'Provisioned'
])
param capacityMode string = 'Serverless'

@description('Resource tags')
param tags object = {}

// ============================================================================
// VARIABLES
// ============================================================================

var accountName = 'cosmos-${resourcePrefix}'
var databaseName = 'corporate-website-db'

// ============================================================================
// RESOURCES
// ============================================================================

resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: accountName
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    
    // Serverless capacity mode (pay-per-request)
    capacityMode: capacityMode
    
    // Locations
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    
    // Consistency level (Session = default, cost-effective)
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    
    // Backup configuration
    backupPolicy: {
      type: 'Continuous'
      continuousModeProperties: {
        tier: 'Continuous7Days' // 7-day point-in-time restore
      }
    }
    
    // Security
    disableKeyBasedMetadataWriteAccess: true // Use RBAC instead
    enableFreeTier: false
    
    // Network security
    publicNetworkAccess: 'Enabled' // Can be disabled for VNet integration
    ipRules: [] // Add specific IPs if needed
    
    // Capabilities
    capabilities: []
  }
}

// Database
resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosDbAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
    // No throughput config for serverless
  }
}

// Container for contact forms
resource contactFormsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'contact-forms'
  properties: {
    resource: {
      id: 'contact-forms'
      partitionKey: {
        paths: [
          '/id'
        ]
        kind: 'Hash'
      }
      
      // Indexing policy (optimize for queries)
      indexingPolicy: {
        automatic: true
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
      
      // TTL for GDPR compliance (5 years = 1825 days)
      defaultTtl: 157680000 // 5 years in seconds
      
      // Conflict resolution
      conflictResolutionPolicy: {
        mode: 'LastWriterWins'
        conflictResolutionPath: '/_ts'
      }
    }
  }
}

// Container for audit logs
resource auditLogsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'audit-logs'
  properties: {
    resource: {
      id: 'audit-logs'
      partitionKey: {
        paths: [
          '/date' // Partition by date for time-series data
        ]
        kind: 'Hash'
      }
      
      // Indexing optimized for time-series queries
      indexingPolicy: {
        automatic: true
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/timestamp/?'
          }
          {
            path: '/event_type/?'
          }
          {
            path: '/user_id/?'
          }
        ]
        excludedPaths: [
          {
            path: '/*'
          }
        ]
      }
      
      // TTL for audit logs (7 years = 2555 days)
      defaultTtl: 220752000 // 7 years in seconds
    }
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

@description('Cosmos DB account resource ID')
output accountId string = cosmosDbAccount.id

@description('Cosmos DB account name')
output accountName string = cosmosDbAccount.name

@description('Cosmos DB endpoint')
output endpoint string = cosmosDbAccount.properties.documentEndpoint

@description('Cosmos DB connection string')
output connectionString string = 'AccountEndpoint=${cosmosDbAccount.properties.documentEndpoint};AccountKey=${cosmosDbAccount.listKeys().primaryMasterKey}'

@description('Cosmos DB database name')
output databaseName string = database.name
