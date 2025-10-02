// Azure Key Vault module
// Centralized secrets management for compliance

@description('Azure region for Key Vault')
param location string

@description('Prefix for resource naming')
param resourcePrefix string

@description('Resource tags')
param tags object = {}

// ============================================================================
// VARIABLES
// ============================================================================

var keyVaultName = 'kv-${resourcePrefix}-${uniqueString(resourceGroup().id)}'

// ============================================================================
// RESOURCES
// ============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: take(keyVaultName, 24) // Key Vault names max 24 chars
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    
    // RBAC-based access control (more secure than access policies)
    enableRbacAuthorization: true
    
    // Security features
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    
    // Network security
    publicNetworkAccess: 'Enabled' // Can be 'Disabled' for VNet integration
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow' // Can be 'Deny' with specific rules
    }
    
    // Enable logging
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

@description('Key Vault resource ID')
output keyVaultId string = keyVault.id

@description('Key Vault name')
output keyVaultName string = keyVault.name

@description('Key Vault URI')
output keyVaultUri string = keyVault.properties.vaultUri
