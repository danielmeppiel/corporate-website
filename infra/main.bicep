targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment used to generate a unique resource token')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

var tags = { 'azd-env-name': environmentName }
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))

resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'rg-${environmentName}'
  location: location
  tags: tags
}

module web 'modules/staticwebapp.bicep' = {
  name: 'web'
  scope: rg
  params: {
    name: 'swa-${resourceToken}'
    location: location
    tags: tags
  }
}

output AZURE_LOCATION string = location
output SERVICE_WEB_URI string = 'https://${web.outputs.defaultHostname}'
