from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from server.meeting_scheduler import MeetingScheduler, CalendarProvider

router = APIRouter()

# Initialize meeting scheduler (credentials would come from environment in production)
meeting_scheduler = MeetingScheduler()


class MeetingRequest(BaseModel):
    """Request model for scheduling a meeting"""
    title: str = Field(..., max_length=200, description="Meeting title")
    description: str = Field(..., max_length=2000, description="Meeting description")
    start_time: str = Field(..., description="Meeting start time (ISO 8601 format)")
    end_time: str = Field(..., description="Meeting end time (ISO 8601 format)")
    attendees: list[str] = Field(..., min_length=1, description="List of attendee email addresses")
    organizer: str = Field(..., description="Organizer email address")
    location: Optional[str] = Field(None, description="Meeting location")
    provider: str = Field("manual", description="Calendar provider: 'google', 'outlook', or 'manual'")
    
    @field_validator('provider')
    @classmethod
    def validate_provider(cls, v):
        valid_providers = ['google', 'outlook', 'manual']
        if v not in valid_providers:
            raise ValueError(f"Provider must be one of: {', '.join(valid_providers)}")
        return v


class MeetingUpdateRequest(BaseModel):
    """Request model for updating a meeting"""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None


@router.post("/meetings")
async def schedule_meeting(request: MeetingRequest) -> Dict[str, Any]:
    """
    Schedule a new meeting
    
    This endpoint allows scheduling meetings through different calendar providers:
    - Google Calendar (requires configuration)
    - Outlook Calendar (requires configuration)
    - Manual process (provides instructions)
    
    Returns:
        Meeting details and scheduling status
    """
    try:
        # Convert provider string to enum
        provider_map = {
            'google': CalendarProvider.GOOGLE,
            'outlook': CalendarProvider.OUTLOOK,
            'manual': CalendarProvider.MANUAL
        }
        provider = provider_map.get(request.provider, CalendarProvider.MANUAL)
        
        # Prepare meeting data
        meeting_data = {
            'title': request.title,
            'description': request.description,
            'start_time': request.start_time,
            'end_time': request.end_time,
            'attendees': request.attendees,
            'organizer': request.organizer,
            'location': request.location
        }
        
        # Schedule the meeting
        result = meeting_scheduler.schedule_meeting(
            meeting_data=meeting_data,
            organizer_id=request.organizer,
            provider=provider
        )
        
        if not result.get('success'):
            raise HTTPException(
                status_code=400,
                detail=result.get('error', 'Failed to schedule meeting')
            )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/meetings/{meeting_id}")
async def get_meeting(meeting_id: str) -> Dict[str, Any]:
    """
    Get meeting details
    
    Note: This is a placeholder implementation.
    In production, this would retrieve meeting details from a database.
    """
    return {
        "meeting_id": meeting_id,
        "message": "Meeting details retrieval not yet implemented",
        "note": "In production, this would fetch meeting data from storage"
    }


@router.patch("/meetings/{meeting_id}")
async def update_meeting(
    meeting_id: str,
    request: MeetingUpdateRequest,
    provider: str = "manual"
) -> Dict[str, Any]:
    """
    Update an existing meeting
    
    Args:
        meeting_id: ID of the meeting to update
        request: Fields to update
        provider: Calendar provider ('google', 'outlook', or 'manual')
    """
    try:
        # Convert provider string to enum
        provider_map = {
            'google': CalendarProvider.GOOGLE,
            'outlook': CalendarProvider.OUTLOOK,
            'manual': CalendarProvider.MANUAL
        }
        calendar_provider = provider_map.get(provider, CalendarProvider.MANUAL)
        
        # Prepare updates (only include non-None fields)
        updates = {}
        if request.title is not None:
            updates['title'] = request.title
        if request.description is not None:
            updates['description'] = request.description
        if request.start_time is not None:
            updates['start_time'] = request.start_time
        if request.end_time is not None:
            updates['end_time'] = request.end_time
        if request.location is not None:
            updates['location'] = request.location
        
        if not updates:
            raise HTTPException(status_code=400, detail="No updates provided")
        
        result = meeting_scheduler.update_meeting(
            meeting_id=meeting_id,
            updates=updates,
            provider=calendar_provider
        )
        
        if not result.get('success'):
            raise HTTPException(
                status_code=400,
                detail=result.get('error', 'Failed to update meeting')
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/meetings/{meeting_id}")
async def cancel_meeting(meeting_id: str, provider: str = "manual") -> Dict[str, Any]:
    """
    Cancel a meeting
    
    Args:
        meeting_id: ID of the meeting to cancel
        provider: Calendar provider ('google', 'outlook', or 'manual')
    """
    try:
        # Convert provider string to enum
        provider_map = {
            'google': CalendarProvider.GOOGLE,
            'outlook': CalendarProvider.OUTLOOK,
            'manual': CalendarProvider.MANUAL
        }
        calendar_provider = provider_map.get(provider, CalendarProvider.MANUAL)
        
        result = meeting_scheduler.cancel_meeting(
            meeting_id=meeting_id,
            provider=calendar_provider
        )
        
        if not result.get('success'):
            raise HTTPException(
                status_code=400,
                detail=result.get('error', 'Failed to cancel meeting')
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/meetings/providers/status")
async def get_provider_status() -> Dict[str, Any]:
    """
    Get the configuration status of calendar providers
    
    Returns information about which calendar providers are configured and ready to use.
    """
    return {
        "google_calendar": {
            "configured": meeting_scheduler.google_adapter.authenticated,
            "status": "ready" if meeting_scheduler.google_adapter.authenticated else "not_configured",
            "message": "Google Calendar API credentials are configured" if meeting_scheduler.google_adapter.authenticated else "Configure GOOGLE_CALENDAR_CREDENTIALS to enable"
        },
        "outlook_calendar": {
            "configured": meeting_scheduler.outlook_adapter.authenticated,
            "status": "ready" if meeting_scheduler.outlook_adapter.authenticated else "not_configured",
            "message": "Outlook Calendar API credentials are configured" if meeting_scheduler.outlook_adapter.authenticated else "Configure OUTLOOK_CALENDAR_CREDENTIALS to enable"
        },
        "manual": {
            "configured": True,
            "status": "ready",
            "message": "Manual scheduling is always available"
        }
    }
