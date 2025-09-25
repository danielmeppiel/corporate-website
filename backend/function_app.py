import azure.functions as func
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Create the Azure Functions app
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# Health check endpoint
@app.route(route="health", methods=["GET"])
def health_check(req: func.HttpRequest) -> func.HttpResponse:
    """Health check endpoint for monitoring"""
    try:
        return func.HttpResponse(
            json.dumps({
                "status": "healthy",
                "service": "corporate-website-api",
                "version": "1.0.0"
            }),
            status_code=200,
            headers={"Content-Type": "application/json"}
        )
    except Exception as e:
        logging.error(f"Health check failed: {str(e)}")
        return func.HttpResponse(
            json.dumps({
                "status": "unhealthy",
                "error": str(e)
            }),
            status_code=500,
            headers={"Content-Type": "application/json"}
        )

# Users API endpoints
@app.route(route="users", methods=["GET", "POST"])
def users_api(req: func.HttpRequest) -> func.HttpResponse:
    """Users API endpoint"""
    try:
        if req.method == "GET":
            # Return mock users data
            users = [
                {"id": 1, "name": "John Doe", "email": "john@example.com"},
                {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
            ]
            return func.HttpResponse(
                json.dumps(users),
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        
        elif req.method == "POST":
            # Create new user
            try:
                user_data = req.get_json()
                if not user_data or not user_data.get("email"):
                    return func.HttpResponse(
                        json.dumps({"error": "Email is required"}),
                        status_code=400,
                        headers={"Content-Type": "application/json"}
                    )
                
                # Mock user creation
                new_user = {
                    "id": 3,
                    "name": user_data.get("name", "Unknown"),
                    "email": user_data["email"]
                }
                
                return func.HttpResponse(
                    json.dumps(new_user),
                    status_code=201,
                    headers={"Content-Type": "application/json"}
                )
                
            except ValueError:
                return func.HttpResponse(
                    json.dumps({"error": "Invalid JSON"}),
                    status_code=400,
                    headers={"Content-Type": "application/json"}
                )
    
    except Exception as e:
        logging.error(f"Users API error: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            status_code=500,
            headers={"Content-Type": "application/json"}
        )

# Contact form submission endpoint
@app.route(route="contact", methods=["POST"])
def contact_form(req: func.HttpRequest) -> func.HttpResponse:
    """Contact form submission with GDPR compliance"""
    try:
        form_data = req.get_json()
        
        # Validate required fields
        required_fields = ["name", "email", "message"]
        missing_fields = [field for field in required_fields if not form_data.get(field)]
        
        if missing_fields:
            return func.HttpResponse(
                json.dumps({
                    "error": f"Missing required fields: {', '.join(missing_fields)}"
                }),
                status_code=400,
                headers={"Content-Type": "application/json"}
            )
        
        # Basic email validation
        email = form_data["email"]
        if "@" not in email or "." not in email:
            return func.HttpResponse(
                json.dumps({"error": "Invalid email format"}),
                status_code=400,
                headers={"Content-Type": "application/json"}
            )
        
        # Log submission for audit trail (GDPR compliance)
        submission_id = f"contact-{hash(email + form_data['name'])}"
        logging.info(f"Contact form submission: {submission_id}")
        
        # In production, this would:
        # 1. Store in Cosmos DB with TTL for GDPR compliance
        # 2. Send notification email
        # 3. Log audit trail
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "message": "Thank you for your message. We'll get back to you soon.",
                "submission_id": submission_id
            }),
            status_code=200,
            headers={"Content-Type": "application/json"}
        )
    
    except ValueError:
        return func.HttpResponse(
            json.dumps({"error": "Invalid JSON"}),
            status_code=400,
            headers={"Content-Type": "application/json"}
        )
    except Exception as e:
        logging.error(f"Contact form error: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            status_code=500,
            headers={"Content-Type": "application/json"}
        )

# GDPR data export endpoint
@app.route(route="data-export/{user_id}", methods=["GET"])
def data_export(req: func.HttpRequest) -> func.HttpResponse:
    """GDPR data export (Right to Data Portability)"""
    try:
        user_id = req.route_params.get('user_id')
        
        if not user_id:
            return func.HttpResponse(
                json.dumps({"error": "User ID is required"}),
                status_code=400,
                headers={"Content-Type": "application/json"}
            )
        
        # Log data export request for audit
        logging.info(f"Data export request for user: {user_id}")
        
        # In production, this would:
        # 1. Verify user identity
        # 2. Collect all user data from Cosmos DB
        # 3. Generate export file
        # 4. Return secure download link
        
        export_data = {
            "user_id": user_id,
            "export_date": "2025-01-01T00:00:00Z",
            "data": {
                "profile": {"name": "John Doe", "email": "john@example.com"},
                "submissions": [],
                "audit_logs": []
            }
        }
        
        return func.HttpResponse(
            json.dumps(export_data),
            status_code=200,
            headers={"Content-Type": "application/json"}
        )
    
    except Exception as e:
        logging.error(f"Data export error: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            status_code=500,
            headers={"Content-Type": "application/json"}
        )

# GDPR data deletion endpoint
@app.route(route="data-deletion/{user_id}", methods=["DELETE"])
def data_deletion(req: func.HttpRequest) -> func.HttpResponse:
    """GDPR data deletion (Right to Erasure)"""
    try:
        user_id = req.route_params.get('user_id')
        
        if not user_id:
            return func.HttpResponse(
                json.dumps({"error": "User ID is required"}),
                status_code=400,
                headers={"Content-Type": "application/json"}
            )
        
        # Log data deletion request for audit
        logging.info(f"Data deletion request for user: {user_id}")
        
        # In production, this would:
        # 1. Verify user identity and authorization
        # 2. Check if deletion is legally required/allowed
        # 3. Delete data from Cosmos DB
        # 4. Maintain audit log of deletion (anonymized)
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "message": "Your data has been scheduled for deletion.",
                "deletion_id": f"del-{user_id}-{hash(user_id)}"
            }),
            status_code=200,
            headers={"Content-Type": "application/json"}
        )
    
    except Exception as e:
        logging.error(f"Data deletion error: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            status_code=500,
            headers={"Content-Type": "application/json"}
        )