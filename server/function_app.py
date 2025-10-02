# Azure Functions configuration
# Python V2 programming model

import azure.functions as func
import logging
import json
from contact_handler import ContactFormHandler, handle_data_export_request, handle_data_deletion_request

# Initialize the function app
app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

# Initialize contact form handler
contact_handler = ContactFormHandler()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.route(route="health", methods=["GET"])
def health_check(req: func.HttpRequest) -> func.HttpResponse:
    """
    Health check endpoint for monitoring
    """
    return func.HttpResponse(
        json.dumps({"status": "healthy", "service": "corporate-website-api"}),
        mimetype="application/json",
        status_code=200
    )


@app.route(route="contact", methods=["POST", "OPTIONS"])
def contact_form_submission(req: func.HttpRequest) -> func.HttpResponse:
    """
    Handle contact form submissions with GDPR compliance
    
    Expected POST body:
    {
        "name": "John Doe",
        "email": "john@example.com",
        "message": "Your message here",
        "consent_given": true,
        "csrf_token": "..."
    }
    """
    # Handle CORS preflight
    if req.method == "OPTIONS":
        return func.HttpResponse(
            status_code=200,
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        )
    
    try:
        # Parse request body
        req_body = req.get_json()
        
        # Get client information
        ip_address = req.headers.get('X-Forwarded-For', '0.0.0.0').split(',')[0]
        user_agent = req.headers.get('User-Agent', 'unknown')
        csrf_token = req_body.get('csrf_token', '')
        
        # Process the form submission
        result = contact_handler.process_submission(
            form_data=req_body,
            ip_address=ip_address,
            user_agent=user_agent,
            csrf_token=csrf_token,
            session_token='azure-function-session'  # In production, use proper session management
        )
        
        # Return response
        status_code = 200 if result.get('success') else 400
        
        return func.HttpResponse(
            json.dumps(result),
            mimetype="application/json",
            status_code=status_code,
            headers={
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            }
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return func.HttpResponse(
            json.dumps({"success": False, "error": "Invalid request data"}),
            mimetype="application/json",
            status_code=400,
            headers={'Access-Control-Allow-Origin': '*'}
        )
    
    except Exception as e:
        logger.error(f"Error processing contact form: {str(e)}")
        return func.HttpResponse(
            json.dumps({"success": False, "error": "An error occurred processing your request"}),
            mimetype="application/json",
            status_code=500,
            headers={'Access-Control-Allow-Origin': '*'}
        )


@app.route(route="data/export", methods=["POST", "OPTIONS"])
def data_export_request(req: func.HttpRequest) -> func.HttpResponse:
    """
    Handle GDPR data export requests (Right to Data Portability)
    
    Expected POST body:
    {
        "email": "user@example.com",
        "verification_code": "..."
    }
    """
    # Handle CORS preflight
    if req.method == "OPTIONS":
        return func.HttpResponse(
            status_code=200,
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        )
    
    try:
        req_body = req.get_json()
        user_identifier = req_body.get('email', '')
        
        if not user_identifier:
            return func.HttpResponse(
                json.dumps({"success": False, "error": "Email is required"}),
                mimetype="application/json",
                status_code=400,
                headers={'Access-Control-Allow-Origin': '*'}
            )
        
        # Process data export request
        result = handle_data_export_request(user_identifier)
        
        status_code = 200 if result.get('success') else 400
        
        return func.HttpResponse(
            json.dumps(result),
            mimetype="application/json",
            status_code=status_code,
            headers={'Access-Control-Allow-Origin': '*'}
        )
        
    except Exception as e:
        logger.error(f"Error processing data export request: {str(e)}")
        return func.HttpResponse(
            json.dumps({"success": False, "error": "An error occurred"}),
            mimetype="application/json",
            status_code=500,
            headers={'Access-Control-Allow-Origin': '*'}
        )


@app.route(route="data/delete", methods=["POST", "OPTIONS"])
def data_deletion_request(req: func.HttpRequest) -> func.HttpResponse:
    """
    Handle GDPR data deletion requests (Right to Erasure)
    
    Expected POST body:
    {
        "email": "user@example.com",
        "verification_code": "..."
    }
    """
    # Handle CORS preflight
    if req.method == "OPTIONS":
        return func.HttpResponse(
            status_code=200,
            headers={
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        )
    
    try:
        req_body = req.get_json()
        user_identifier = req_body.get('email', '')
        
        if not user_identifier:
            return func.HttpResponse(
                json.dumps({"success": False, "error": "Email is required"}),
                mimetype="application/json",
                status_code=400,
                headers={'Access-Control-Allow-Origin': '*'}
            )
        
        # Process data deletion request
        result = handle_data_deletion_request(user_identifier)
        
        status_code = 200 if result.get('success') else 400
        
        return func.HttpResponse(
            json.dumps(result),
            mimetype="application/json",
            status_code=status_code,
            headers={'Access-Control-Allow-Origin': '*'}
        )
        
    except Exception as e:
        logger.error(f"Error processing data deletion request: {str(e)}")
        return func.HttpResponse(
            json.dumps({"success": False, "error": "An error occurred"}),
            mimetype="application/json",
            status_code=500,
            headers={'Access-Control-Allow-Origin': '*'}
        )


# Timer trigger for cleanup tasks (runs daily at midnight UTC)
@app.schedule(schedule="0 0 0 * * *", arg_name="timer", run_on_startup=False)
def cleanup_expired_data(timer: func.TimerRequest) -> None:
    """
    Scheduled function to clean up expired data based on retention policies
    Runs daily at midnight UTC
    """
    logger.info("Starting scheduled cleanup task")
    
    try:
        # TODO: Implement cleanup logic
        # - Remove expired contact forms (TTL handles this in Cosmos DB)
        # - Remove expired audit logs (lifecycle policies handle this in Storage)
        # - Generate compliance reports
        
        logger.info("Cleanup task completed successfully")
        
    except Exception as e:
        logger.error(f"Error during cleanup task: {str(e)}")
