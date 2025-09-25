@description('Azure CDN for global content delivery and performance optimization')
param cdnProfileName string
param location string = 'Global'
param sku string = 'Standard_Microsoft'
param endpointName string
param originHostName string
param tags object = {}

resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: cdnProfileName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  properties: {
    originResponseTimeoutSeconds: 60
  }
}

resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  name: endpointName
  parent: cdnProfile
  location: location
  tags: tags
  properties: {
    origins: [
      {
        name: 'origin1'
        properties: {
          hostName: originHostName
          originHostHeader: originHostName
          priority: 1
          weight: 1000
          enabled: true
          httpPort: 80
          httpsPort: 443
        }
      }
    ]
    
    // Caching behavior for performance and cost optimization
    deliveryPolicy: {
      rules: [
        {
          name: 'StaticAssetsCaching'
          order: 1
          conditions: [
            {
              name: 'UrlFileExtension'
              parameters: {
                operator: 'Equal'
                negateCondition: false
                matchValues: [
                  'css'
                  'js'
                  'png'
                  'jpg'
                  'jpeg'
                  'gif'
                  'svg'
                  'ico'
                  'woff'
                  'woff2'
                  'ttf'
                  'eot'
                ]
                transforms: [
                  'Lowercase'
                ]
              }
            }
          ]
          actions: [
            {
              name: 'CacheExpiration'
              parameters: {
                cacheBehavior: 'Override'
                cacheType: 'All'
                cacheDuration: '30.00:00:00' // 30 days
              }
            }
            {
              name: 'ResponseHeader'
              parameters: {
                headerAction: 'Append'
                headerName: 'Cache-Control'
                value: 'public, max-age=2592000, immutable'
              }
            }
          ]
        }
        {
          name: 'HTMLCaching'
          order: 2
          conditions: [
            {
              name: 'UrlFileExtension'
              parameters: {
                operator: 'Equal'
                negateCondition: false
                matchValues: [
                  'html'
                  'htm'
                ]
                transforms: [
                  'Lowercase'
                ]
              }
            }
          ]
          actions: [
            {
              name: 'CacheExpiration'
              parameters: {
                cacheBehavior: 'Override'
                cacheType: 'All'
                cacheDuration: '01:00:00' // 1 hour
              }
            }
          ]
        }
        {
          name: 'SecurityHeaders'
          order: 3
          conditions: [
            {
              name: 'RequestScheme'
              parameters: {
                operator: 'Equal'
                negateCondition: false
                matchValues: [
                  'HTTPS'
                ]
              }
            }
          ]
          actions: [
            {
              name: 'ResponseHeader'
              parameters: {
                headerAction: 'Append'
                headerName: 'Strict-Transport-Security'
                value: 'max-age=31536000; includeSubDomains'
              }
            }
            {
              name: 'ResponseHeader'
              parameters: {
                headerAction: 'Append'
                headerName: 'X-Content-Type-Options'
                value: 'nosniff'
              }
            }
            {
              name: 'ResponseHeader'
              parameters: {
                headerAction: 'Append'
                headerName: 'X-Frame-Options'
                value: 'DENY'
              }
            }
            {
              name: 'ResponseHeader'
              parameters: {
                headerAction: 'Append'
                headerName: 'X-XSS-Protection'
                value: '1; mode=block'
              }
            }
            {
              name: 'ResponseHeader'
              parameters: {
                headerAction: 'Append'
                headerName: 'Content-Security-Policy'
                value: 'default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; font-src \'self\' data:; connect-src \'self\' https:'
              }
            }
          ]
        }
      ]
    }
    
    // Origin settings
    isHttpAllowed: false
    isHttpsAllowed: true
    queryStringCachingBehavior: 'IgnoreQueryString'
    isCompressionEnabled: true
    contentTypesToCompress: [
      'application/eot'
      'application/font'
      'application/font-sfnt'
      'application/javascript'
      'application/json'
      'application/opentype'
      'application/otf'
      'application/pkcs7-mime'
      'application/truetype'
      'application/ttf'
      'application/vnd.ms-fontobject'
      'application/xhtml+xml'
      'application/xml'
      'application/xml+rss'
      'application/x-font-opentype'
      'application/x-font-truetype'
      'application/x-font-ttf'
      'application/x-httpd-cgi'
      'application/x-javascript'
      'application/x-mpegurl'
      'application/x-opentype'
      'application/x-otf'
      'application/x-perl'
      'application/x-ttf'
      'font/eot'
      'font/ttf'
      'font/otf'
      'font/opentype'
      'image/svg+xml'
      'text/css'
      'text/csv'
      'text/html'
      'text/javascript'
      'text/js'
      'text/plain'
      'text/richtext'
      'text/tab-separated-values'
      'text/xml'
      'text/x-script'
      'text/x-component'
      'text/x-java-source'
    ]
    
    // Geo-filtering (can be configured based on requirements)
    geoFilters: []
    
    // URL rewrite rules for SPA routing
    urlSigningKeys: []
    
    // Optimization type
    optimizationType: 'GeneralWebDelivery'
    
    // Default origin group (for failover scenarios)
    defaultOriginGroup: {
      healthProbeSettings: {
        probePath: '/'
        probeRequestType: 'HEAD'
        probeProtocol: 'Https'
        probeIntervalInSeconds: 120
      }
      origins: [
        {
          name: 'origin1'
          properties: {
            hostName: originHostName
            originHostHeader: originHostName
            priority: 1
            weight: 1000
            enabled: true
          }
        }
      ]
    }
  }
}

// Enable diagnostic logging for monitoring
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'cdn-audit-logs'
  scope: cdnEndpoint
  properties: {
    logs: [
      {
        category: 'CoreAnalytics'
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

output profileName string = cdnProfile.name
output profileId string = cdnProfile.id
output endpointName string = cdnEndpoint.name
output endpointId string = cdnEndpoint.id
output endpointUrl string = 'https://${cdnEndpoint.properties.hostName}'
output originHostName string = originHostName