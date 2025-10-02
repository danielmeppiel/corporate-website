// Key Vault RBAC module
// Assigns RBAC role to access Key Vault

@description('Key Vault name')
param keyVaultName string

@description('Principal ID (managed identity)')
param principalId string

@description('Role definition ID (GUID)')
param roleDefinitionId string

// ============================================================================
// RESOURCES
// ============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' existing = {
  name: keyVaultName
}

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, principalId, roleDefinitionId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleDefinitionId)
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

@description('Role assignment ID')
output roleAssignmentId string = roleAssignment.id
