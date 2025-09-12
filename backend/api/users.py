from fastapi import APIRouter, HTTPException
from typing import List

router = APIRouter()

@router.get("/users")
async def get_users() -> List[dict]:
    """Get all users."""
    return [{"id": 1, "name": "John Doe", "email": "john@example.com"}]

@router.post("/users")
async def create_user(user_data: dict) -> dict:
    """Create a new user."""
    if not user_data.get("email"):
        raise HTTPException(status_code=400, detail="Email is required")
    return {"id": 2, "name": user_data["name"], "email": user_data["email"]}
