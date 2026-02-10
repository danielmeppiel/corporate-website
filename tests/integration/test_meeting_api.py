"""
Integration tests for meeting API endpoints
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from fastapi import FastAPI
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from backend.api.meetings import router


# Create test FastAPI app
app = FastAPI()
app.include_router(router, prefix="/api")

client = TestClient(app)


class TestMeetingAPIEndpoints:
    """Test suite for meeting API endpoints"""
    
    def test_schedule_meeting_manual_success(self):
        """Test successful meeting scheduling with manual provider"""
        response = client.post("/api/meetings", json={
            "title": "Test Meeting",
            "description": "Test description",
            "start_time": (datetime.now() + timedelta(days=1)).isoformat(),
            "end_time": (datetime.now() + timedelta(days=1, hours=1)).isoformat(),
            "attendees": ["test1@example.com", "test2@example.com"],
            "organizer": "organizer@example.com",
            "location": "Test Room",
            "provider": "manual"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "meeting_id" in data
        assert data["provider"] == "manual"
        assert "manual_instructions" in data
    
    def test_schedule_meeting_invalid_provider(self):
        """Test scheduling with invalid provider"""
        response = client.post("/api/meetings", json={
            "title": "Test Meeting",
            "description": "Test description",
            "start_time": (datetime.now() + timedelta(days=1)).isoformat(),
            "end_time": (datetime.now() + timedelta(days=1, hours=1)).isoformat(),
            "attendees": ["test@example.com"],
            "organizer": "organizer@example.com",
            "provider": "invalid_provider"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_schedule_meeting_missing_required_fields(self):
        """Test scheduling without required fields"""
        response = client.post("/api/meetings", json={
            "title": "Test Meeting"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_schedule_meeting_invalid_time_range(self):
        """Test scheduling with end time before start time"""
        response = client.post("/api/meetings", json={
            "title": "Test Meeting",
            "description": "Test description",
            "start_time": (datetime.now() + timedelta(days=1)).isoformat(),
            "end_time": (datetime.now() + timedelta(days=1, hours=-1)).isoformat(),
            "attendees": ["test@example.com"],
            "organizer": "organizer@example.com",
            "provider": "manual"
        })
        
        assert response.status_code == 400  # Bad request
    
    def test_get_meeting_by_id(self):
        """Test retrieving meeting details by ID"""
        response = client.get("/api/meetings/test_meeting_id")
        
        assert response.status_code == 200
        data = response.json()
        assert data["meeting_id"] == "test_meeting_id"
    
    def test_update_meeting(self):
        """Test updating a meeting"""
        response = client.patch(
            "/api/meetings/test_meeting_id?provider=manual",
            json={
                "title": "Updated Meeting Title",
                "location": "New Location"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["meeting_id"] == "test_meeting_id"
    
    def test_update_meeting_no_updates(self):
        """Test updating meeting without providing any updates"""
        response = client.patch(
            "/api/meetings/test_meeting_id?provider=manual",
            json={}
        )
        
        assert response.status_code == 400  # Bad request
    
    def test_cancel_meeting(self):
        """Test canceling a meeting"""
        response = client.delete("/api/meetings/test_meeting_id?provider=manual")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["meeting_id"] == "test_meeting_id"
    
    def test_get_provider_status(self):
        """Test getting calendar provider status"""
        response = client.get("/api/meetings/providers/status")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check all providers are present
        assert "google_calendar" in data
        assert "outlook_calendar" in data
        assert "manual" in data
        
        # Manual should always be ready
        assert data["manual"]["configured"] is True
        assert data["manual"]["status"] == "ready"
        
        # Google and Outlook should not be configured by default
        assert data["google_calendar"]["configured"] is False
        assert data["outlook_calendar"]["configured"] is False
    
    def test_schedule_meeting_google_no_credentials(self):
        """Test scheduling with Google Calendar without credentials"""
        response = client.post("/api/meetings", json={
            "title": "Test Meeting",
            "description": "Test description",
            "start_time": (datetime.now() + timedelta(days=1)).isoformat(),
            "end_time": (datetime.now() + timedelta(days=1, hours=1)).isoformat(),
            "attendees": ["test@example.com"],
            "organizer": "organizer@example.com",
            "provider": "google"
        })
        
        assert response.status_code == 400  # Bad request
        data = response.json()
        assert "credentials not configured" in data["detail"]
    
    def test_schedule_meeting_outlook_no_credentials(self):
        """Test scheduling with Outlook Calendar without credentials"""
        response = client.post("/api/meetings", json={
            "title": "Test Meeting",
            "description": "Test description",
            "start_time": (datetime.now() + timedelta(days=1)).isoformat(),
            "end_time": (datetime.now() + timedelta(days=1, hours=1)).isoformat(),
            "attendees": ["test@example.com"],
            "organizer": "organizer@example.com",
            "provider": "outlook"
        })
        
        assert response.status_code == 400  # Bad request
        data = response.json()
        assert "credentials not configured" in data["detail"]


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
