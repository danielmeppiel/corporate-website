#!/bin/bash
# Azure deployment script for Corporate Website
# This script deploys the Bicep templates to Azure

set -e

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BICEP_DIR="$PROJECT_ROOT/infrastructure/bicep"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo "=========================================="
    echo "  Azure Deployment - Corporate Website"
    echo "=========================================="
    echo ""
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it from: https://docs.microsoft.com/cli/azure/install-azure-cli"
        exit 1
    fi
    
    # Check Azure CLI version
    AZ_VERSION=$(az version --query '"azure-cli"' -o tsv)
    log_success "Azure CLI version: $AZ_VERSION"
    
    # Check if logged in
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    # Show current subscription
    SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    log_success "Current subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)"
    
    echo ""
}

select_environment() {
    echo "Select deployment environment:"
    echo "  1) Development (dev)"
    echo "  2) Production (prod)"
    echo ""
    read -p "Enter choice [1-2]: " choice
    
    case $choice in
        1)
            ENVIRONMENT="dev"
            PARAM_FILE="$BICEP_DIR/parameters/dev.json"
            ;;
        2)
            ENVIRONMENT="prod"
            PARAM_FILE="$BICEP_DIR/parameters/prod.json"
            ;;
        *)
            log_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
    
    log_info "Selected environment: $ENVIRONMENT"
    echo ""
}

validate_bicep() {
    log_info "Validating Bicep templates..."
    
    if az deployment sub validate \
        --location westeurope \
        --template-file "$BICEP_DIR/main.bicep" \
        --parameters "$PARAM_FILE" \
        --output none; then
        log_success "Bicep validation passed"
    else
        log_error "Bicep validation failed"
        exit 1
    fi
    
    echo ""
}

preview_deployment() {
    log_info "Generating deployment preview (What-If)..."
    echo ""
    
    az deployment sub what-if \
        --location westeurope \
        --template-file "$BICEP_DIR/main.bicep" \
        --parameters "$PARAM_FILE"
    
    echo ""
    read -p "Continue with deployment? [y/N]: " confirm
    
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        log_warning "Deployment cancelled by user"
        exit 0
    fi
    
    echo ""
}

deploy_infrastructure() {
    log_info "Deploying infrastructure to Azure..."
    echo ""
    
    DEPLOYMENT_NAME="corporate-website-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
    
    if az deployment sub create \
        --name "$DEPLOYMENT_NAME" \
        --location westeurope \
        --template-file "$BICEP_DIR/main.bicep" \
        --parameters "$PARAM_FILE" \
        --output json > deployment-output.json; then
        
        log_success "Infrastructure deployment completed"
        echo ""
        
        # Extract outputs
        log_info "Deployment outputs:"
        az deployment sub show \
            --name "$DEPLOYMENT_NAME" \
            --query properties.outputs \
            --output json | jq -r '
                "  Resource Group: " + .resourceGroupName.value,
                "  Frontend URL: https://" + .staticWebAppUrl.value,
                "  API URL: https://" + .functionAppUrl.value,
                "  Estimated Monthly Cost: " + .deploymentSummary.value.estimatedMonthlyCost
            '
        
        echo ""
        log_success "Deployment name: $DEPLOYMENT_NAME"
        
    else
        log_error "Infrastructure deployment failed"
        exit 1
    fi
    
    echo ""
}

configure_static_web_app() {
    log_info "Static Web App deployment will be handled by GitHub Actions"
    log_info "The deployment token has been generated during infrastructure deployment"
    
    # Extract deployment token
    RESOURCE_GROUP=$(jq -r '.properties.outputs.resourceGroupName.value' deployment-output.json)
    SWA_NAME=$(jq -r '.properties.outputs.staticWebAppName.value' deployment-output.json 2>/dev/null || echo "")
    
    if [ -n "$SWA_NAME" ]; then
        log_info "To configure GitHub Actions, add the following secret to your repository:"
        echo ""
        echo "  Secret name: AZURE_STATIC_WEB_APPS_API_TOKEN"
        echo "  Resource Group: $RESOURCE_GROUP"
        echo "  Static Web App: $SWA_NAME"
        echo ""
        log_info "Get the token with:"
        echo "  az staticwebapp secrets list --name $SWA_NAME --resource-group $RESOURCE_GROUP --query properties.apiKey -o tsv"
    fi
    
    echo ""
}

print_next_steps() {
    echo "=========================================="
    echo "  Next Steps"
    echo "=========================================="
    echo ""
    echo "1. Configure GitHub Actions secrets:"
    echo "   - AZURE_STATIC_WEB_APPS_API_TOKEN"
    echo "   - AZURE_FUNCTIONAPP_PUBLISH_PROFILE (optional)"
    echo ""
    echo "2. Push code to GitHub to trigger deployment"
    echo ""
    echo "3. Monitor deployment in Azure Portal"
    echo ""
    echo "4. Configure custom domain (optional)"
    echo ""
    echo "5. Set up monitoring alerts in Application Insights"
    echo ""
    log_success "Deployment complete!"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    print_banner
    check_prerequisites
    select_environment
    validate_bicep
    preview_deployment
    deploy_infrastructure
    configure_static_web_app
    print_next_steps
}

# Run main function
main "$@"
