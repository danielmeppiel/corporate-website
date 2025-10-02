// Cosmos DB RBAC module
// Assigns RBAC role to access Cosmos DB

@description('Cosmos DB account name')
param cosmosDbAccountName string

@description('Principal ID (managed identity)')
param principalId string

// Built-in Cosmos DB Data Contributor role
var roleDefinitionId = '00000000-0000-0000-0000-000000000002'

// ============================================================================
// RESOURCES
// ============================================================================

resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' existing = {
  name: cosmosDbAccountName
}

resource sqlRoleAssignment 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2023-04-15' = {
  name: guid(cosmosDbAccount.id, principalId, roleDefinitionId)
  parent: cosmosDbAccount
  properties: {
    roleDefinitionId: '${cosmosDbAccount.id}/sqlRoleDefinitions/${roleDefinitionId}'
    principalId: principalId
    scope: cosmosDbAccount.id
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

@description('Role assignment ID')
output roleAssignmentId string = sqlRoleAssignment.id
