#!/bin/bash

# Azure Deployment Script for Corporate Website
# Usage: ./scripts/deploy.sh --environment <dev|prod> --location <location> [--resource-group <name>]

set -e

# Default values
ENVIRONMENT=""
LOCATION="eastus"
RESOURCE_GROUP=""
PROJECT_NAME="corporate-website"
DEPLOYMENT_NAME=""
VALIDATE_ONLY=false
FORCE_DEPLOY=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display help
show_help() {
    cat << EOF
Azure Corporate Website Deployment Script

Usage: $0 --environment <dev|prod> --location <location> [OPTIONS]

Required Arguments:
    --environment, -e    Target environment (dev or prod)
    --location, -l       Azure region for deployment (default: eastus)

Optional Arguments:
    --resource-group, -g Resource group name (auto-generated if not provided)
    --validate-only      Only validate the deployment, don't deploy
    --force             Skip confirmation prompts
    --help, -h          Show this help message

Examples:
    $0 --environment dev --location eastus
    $0 --environment prod --location eastus --resource-group rg-corporate-website-prod
    $0 --environment dev --validate-only

EOF
}

# Function to log messages
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} ${timestamp} - $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} ${timestamp} - $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} ${timestamp} - $message"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} ${timestamp} - $message"
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log "ERROR" "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        log "ERROR" "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    # Check if bicep files exist
    if [[ ! -f "infrastructure/bicep/main.bicep" ]]; then
        log "ERROR" "Main Bicep template not found at infrastructure/bicep/main.bicep"
        exit 1
    fi
    
    if [[ ! -f "infrastructure/bicep/parameters/${ENVIRONMENT}.json" ]]; then
        log "ERROR" "Parameter file not found at infrastructure/bicep/parameters/${ENVIRONMENT}.json"
        exit 1
    fi
    
    log "INFO" "Prerequisites check passed"
}

# Function to generate resource group name
generate_resource_group_name() {
    echo "rg-${PROJECT_NAME}-${ENVIRONMENT}"
}

# Function to create resource group
create_resource_group() {
    local rg_name=$1
    local location=$2
    
    log "INFO" "Checking if resource group '$rg_name' exists..."
    
    if az group show --name "$rg_name" &> /dev/null; then
        log "INFO" "Resource group '$rg_name' already exists"
    else
        log "INFO" "Creating resource group '$rg_name' in '$location'..."
        az group create --name "$rg_name" --location "$location" --tags \
            Environment="$ENVIRONMENT" \
            Project="$PROJECT_NAME" \
            CreatedBy="deploy-script" \
            CreatedAt="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
        log "INFO" "Resource group created successfully"
    fi
}

# Function to estimate costs
show_cost_estimate() {
    local env=$1
    log "INFO" "Estimated monthly costs for $env environment:"
    
    if [[ "$env" == "dev" ]]; then
        cat << EOF

┌─ Development Environment Cost Estimate ────────────┐
│ Static Web App (Free):        \$0/month            │
│ Azure Functions (Consumption): \$5-10/month        │
│ Cosmos DB (Serverless):       \$5-10/month         │
│ Storage Account:              \$2-5/month          │
│ Key Vault:                    \$3/month            │
│ Application Insights:         \$0-2/month          │
│ CDN:                          \$0/month            │
├─────────────────────────────────────────────────────┤
│ Total Estimated:              \$15-30/month        │
└─────────────────────────────────────────────────────┘

EOF
    else
        cat << EOF

┌─ Production Environment Cost Estimate ─────────────┐
│ Static Web App (Standard):    \$10/month           │
│ Azure Functions (Consumption): \$15-25/month       │
│ Cosmos DB (Serverless):       \$20-40/month        │
│ Storage Account:              \$5-10/month         │
│ Key Vault:                    \$3/month            │
│ Application Insights:         \$5-15/month         │
│ CDN (Standard Microsoft):     \$5-15/month         │
├─────────────────────────────────────────────────────┤
│ Total Estimated:              \$63-118/month       │
└─────────────────────────────────────────────────────┘

EOF
    fi
    
    log "WARN" "These are estimates. Actual costs may vary based on usage patterns."
}

# Function to validate deployment
validate_deployment() {
    local rg_name=$1
    local template_file=$2
    local parameters_file=$3
    local deployment_name=$4
    
    log "INFO" "Validating Bicep deployment..."
    
    az deployment group validate \
        --resource-group "$rg_name" \
        --template-file "$template_file" \
        --parameters "@$parameters_file" \
        --parameters environment="$ENVIRONMENT" \
        --name "$deployment_name"
    
    if [[ $? -eq 0 ]]; then
        log "INFO" "Deployment validation passed"
        return 0
    else
        log "ERROR" "Deployment validation failed"
        return 1
    fi
}

# Function to deploy resources
deploy_resources() {
    local rg_name=$1
    local template_file=$2
    local parameters_file=$3
    local deployment_name=$4
    
    log "INFO" "Starting deployment to resource group '$rg_name'..."
    log "INFO" "Deployment name: $deployment_name"
    
    az deployment group create \
        --resource-group "$rg_name" \
        --template-file "$template_file" \
        --parameters "@$parameters_file" \
        --parameters environment="$ENVIRONMENT" \
        --name "$deployment_name" \
        --verbose
    
    if [[ $? -eq 0 ]]; then
        log "INFO" "Deployment completed successfully"
        return 0
    else
        log "ERROR" "Deployment failed"
        return 1
    fi
}

# Function to show deployment outputs
show_outputs() {
    local rg_name=$1
    local deployment_name=$2
    
    log "INFO" "Retrieving deployment outputs..."
    
    local outputs=$(az deployment group show \
        --resource-group "$rg_name" \
        --name "$deployment_name" \
        --query "properties.outputs" \
        --output json)
    
    if [[ $? -eq 0 && "$outputs" != "null" ]]; then
        echo
        log "INFO" "Deployment Outputs:"
        echo "$outputs" | jq -r '
            to_entries[] | 
            select(.key | test("Url|Endpoint|Name")) | 
            "  " + .key + ": " + .value.value
        '
        echo
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        -g|--resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        --validate-only)
            VALIDATE_ONLY=true
            shift
            ;;
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z "$ENVIRONMENT" ]]; then
    log "ERROR" "Environment is required. Use --environment <dev|prod>"
    show_help
    exit 1
fi

if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    log "ERROR" "Environment must be 'dev' or 'prod'"
    exit 1
fi

# Set resource group name if not provided
if [[ -z "$RESOURCE_GROUP" ]]; then
    RESOURCE_GROUP=$(generate_resource_group_name)
fi

# Generate deployment name
DEPLOYMENT_NAME="deploy-${PROJECT_NAME}-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"

# Set file paths
TEMPLATE_FILE="infrastructure/bicep/main.bicep"
PARAMETERS_FILE="infrastructure/bicep/parameters/${ENVIRONMENT}.json"

# Main execution
main() {
    log "INFO" "Starting Azure deployment for Corporate Website"
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Location: $LOCATION"
    log "INFO" "Resource Group: $RESOURCE_GROUP"
    log "INFO" "Template: $TEMPLATE_FILE"
    log "INFO" "Parameters: $PARAMETERS_FILE"
    
    # Check prerequisites
    check_prerequisites
    
    # Show cost estimate
    show_cost_estimate "$ENVIRONMENT"
    
    # Confirmation prompt (unless --force is used)
    if [[ "$FORCE_DEPLOY" != "true" && "$VALIDATE_ONLY" != "true" ]]; then
        echo
        read -p "Do you want to continue with the deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    # Create resource group
    create_resource_group "$RESOURCE_GROUP" "$LOCATION"
    
    # Validate deployment
    if ! validate_deployment "$RESOURCE_GROUP" "$TEMPLATE_FILE" "$PARAMETERS_FILE" "$DEPLOYMENT_NAME"; then
        exit 1
    fi
    
    # Exit if validation only
    if [[ "$VALIDATE_ONLY" == "true" ]]; then
        log "INFO" "Validation completed. Exiting (--validate-only flag used)"
        exit 0
    fi
    
    # Deploy resources
    if deploy_resources "$RESOURCE_GROUP" "$TEMPLATE_FILE" "$PARAMETERS_FILE" "$DEPLOYMENT_NAME"; then
        # Show outputs
        show_outputs "$RESOURCE_GROUP" "$DEPLOYMENT_NAME"
        
        log "INFO" "Deployment completed successfully!"
        log "INFO" "Resource Group: $RESOURCE_GROUP"
        log "INFO" "Environment: $ENVIRONMENT"
        
        # Show next steps
        cat << EOF

🎉 Deployment completed successfully!

📋 Next Steps:
1. Configure custom domains in Static Web App (if needed)
2. Set up monitoring alerts in Application Insights
3. Review cost management dashboard
4. Test application endpoints

🔗 Useful Links:
- Azure Portal: https://portal.azure.com/#@/resource/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP
- Cost Management: https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/Menu/overview

EOF
    else
        log "ERROR" "Deployment failed. Check the error messages above."
        exit 1
    fi
}

# Run main function
main