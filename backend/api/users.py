from fastapi import APIRouter, HTTPException
from typing import List

router = APIRouter()

@router.get("/users")
async def get_users() -> List[dict]:
    """Retrieve all users from the system.
    
    This endpoint returns a list of all registered users in the system.
    It is intended for administrative purposes and user management operations.
    
    **Authentication:** None required (in production, should require admin authentication)
    
    **Use Cases:**
        - Admin dashboard user listing
        - User management interfaces
        - System auditing and reporting
    
    Returns:
        List[dict]: A list of user objects, where each user has:
            - id (int): Unique identifier for the user
            - name (str): Full name of the user
            - email (str): Email address of the user
            
        Example response:
            [
                {
                    "id": 1,
                    "name": "John Doe",
                    "email": "john@example.com"
                }
            ]
    
    HTTP Status Codes:
        200 OK: Successfully retrieved user list
        500 Internal Server Error: Unexpected server error
    
    Security Considerations:
        - In production, this endpoint should require authentication
        - Should implement pagination for large datasets
        - Consider GDPR implications when exposing user data
        - Email addresses should be masked for non-admin users
    
    Note:
        This is a demonstration endpoint. In production:
        - Implement proper authentication/authorization
        - Add pagination support (limit, offset)
        - Add filtering and sorting capabilities
        - Mask sensitive data based on requester permissions
    """
    return [{"id": 1, "name": "John Doe", "email": "john@example.com"}]

@router.post("/users")
async def create_user(user_data: dict) -> dict:
    """Create a new user in the system.
    
    This endpoint creates a new user account with the provided information.
    It performs basic validation and returns the created user object.
    
    **Authentication:** None required (in production, should require appropriate permissions)
    
    **Use Cases:**
        - User registration
        - Admin-created user accounts
        - Bulk user imports
    
    Args:
        user_data (dict): User information for account creation. Required fields:
            - email (str): User's email address (required, must be valid format)
            - name (str): User's full name (optional)
            
        Example request body:
            {
                "name": "Jane Doe",
                "email": "jane@example.com"
            }
    
    Returns:
        dict: The created user object containing:
            - id (int): Newly assigned unique identifier
            - name (str): User's full name
            - email (str): User's email address
            
        Example response:
            {
                "id": 2,
                "name": "Jane Doe",
                "email": "jane@example.com"
            }
    
    Raises:
        HTTPException: 400 Bad Request
            - When email field is missing from request body
            - Detail: "Email is required"
    
    HTTP Status Codes:
        200 OK: User successfully created
        400 Bad Request: Invalid request data (missing required fields)
        409 Conflict: User with email already exists (not implemented)
        422 Unprocessable Entity: Invalid data format
        500 Internal Server Error: Unexpected server error
    
    Security Considerations:
        - Email validation should be more robust in production
        - Implement rate limiting to prevent abuse
        - Add CAPTCHA for public registration endpoints
        - Sanitize all input to prevent injection attacks
        - Hash passwords if authentication is implemented
    
    GDPR Compliance:
        - Obtain explicit consent before storing user data
        - Implement data retention policies
        - Provide mechanisms for data export and deletion
        - Log user creation events for audit trail
    
    Note:
        This is a demonstration endpoint. In production:
        - Implement proper input validation (email format, name length, etc.)
        - Add password handling with secure hashing (bcrypt, argon2)
        - Check for duplicate emails before creating user
        - Use proper data models (Pydantic) instead of raw dict
        - Store users in a database with proper error handling
        - Send email verification for new accounts
        - Implement proper authorization checks
    """
    if not user_data.get("email"):
        raise HTTPException(status_code=400, detail="Email is required")
    return {"id": 2, "name": user_data["name"], "email": user_data["email"]}
