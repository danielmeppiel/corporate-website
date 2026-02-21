import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from backend.api.users import router

class TestUserAPI:
    def setup_method(self):
        # Create a FastAPI app and include the router
        app = FastAPI()
        app.include_router(router)
        self.client = TestClient(app)
    
    def test_get_users_endpoint(self):
        response = self.client.get("/users")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_user_endpoint(self):
        user_data = {"name": "Jane Doe", "email": "jane@example.com"}
        response = self.client.post("/users", json=user_data)
        assert response.status_code == 200
        assert response.json()["email"] == "jane@example.com"
