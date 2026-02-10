"""
Meeting scheduling automation with calendar integration
Following compliance standards from APM dependencies
"""

import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum

# Configure logging for audit trail (compliance requirement)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('audit.log'),
        logging.StreamHandler()
    ]
)

audit_logger = logging.getLogger('meeting_audit')


class CalendarProvider(Enum):
    """Supported calendar providers"""
    GOOGLE = "google"
    OUTLOOK = "outlook"
    MANUAL = "manual"


@dataclass
class MeetingDetails:
    """Meeting data structure with validation"""
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    attendees: List[str]
    organizer: str
    location: Optional[str] = None
    meeting_id: Optional[str] = None
    calendar_provider: CalendarProvider = CalendarProvider.MANUAL
    
    def __post_init__(self):
        """Validate data after initialization"""
        self.validate()
    
    def validate(self) -> None:
        """Validate meeting data for security and compliance"""
        # Validate title
        if not isinstance(self.title, str) or len(self.title) > 200:
            raise ValueError("Invalid title field")
        
        # Validate description
        if not isinstance(self.description, str) or len(self.description) > 2000:
            raise ValueError("Invalid description field")
        
        # Validate time constraints
        if not isinstance(self.start_time, datetime):
            raise ValueError("Invalid start_time format")
        
        if not isinstance(self.end_time, datetime):
            raise ValueError("Invalid end_time format")
        
        if self.end_time <= self.start_time:
            raise ValueError("End time must be after start time")
        
        # Validate duration (max 8 hours)
        duration = self.end_time - self.start_time
        if duration > timedelta(hours=8):
            raise ValueError("Meeting duration cannot exceed 8 hours")
        
        # Validate attendees
        if not isinstance(self.attendees, list) or len(self.attendees) == 0:
            raise ValueError("At least one attendee is required")
        
        # Email format validation for attendees and organizer
        import re
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        
        for email in self.attendees:
            if not re.match(email_pattern, email):
                raise ValueError(f"Invalid email format: {email}")
        
        if not re.match(email_pattern, self.organizer):
            raise ValueError(f"Invalid organizer email format: {self.organizer}")


class AuditLogger:
    """Audit logging for compliance requirements"""
    
    @staticmethod
    def log_event(event_type: str, event_data: Dict[str, Any], 
                  user_id: Optional[str] = None) -> None:
        """Log audit events for compliance tracking"""
        from datetime import timezone
        audit_entry = {
            'id': str(uuid.uuid4()),
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'event_type': event_type,
            'user_id': user_id,
            'event_data': event_data
        }
        
        # Log to audit trail (required for compliance)
        audit_logger.info(f"AUDIT: {json.dumps(audit_entry)}")


class GoogleCalendarAdapter:
    """Adapter for Google Calendar API integration"""
    
    def __init__(self, credentials: Optional[Dict[str, Any]] = None):
        """
        Initialize Google Calendar adapter
        
        Args:
            credentials: Google Calendar API credentials
                        (client_id, client_secret, refresh_token)
        """
        self.credentials = credentials
        self.authenticated = credentials is not None
    
    def create_meeting(self, meeting: MeetingDetails) -> Dict[str, Any]:
        """
        Create meeting in Google Calendar
        
        Note: This is a placeholder implementation. In production:
        1. Use Google Calendar API v3 client library
        2. Authenticate with OAuth 2.0
        3. Create calendar event with proper API calls
        """
        if not self.authenticated:
            return {
                'success': False,
                'error': 'Google Calendar credentials not configured',
                'instructions': 'Please configure GOOGLE_CALENDAR_CREDENTIALS in environment'
            }
        
        # Placeholder implementation
        meeting_id = f"google_{uuid.uuid4()}"
        
        AuditLogger.log_event('google_calendar_meeting_created', {
            'meeting_id': meeting_id,
            'title': meeting.title,
            'attendees_count': len(meeting.attendees)
        })
        
        return {
            'success': True,
            'meeting_id': meeting_id,
            'provider': 'google',
            'calendar_link': f'https://calendar.google.com/calendar/event?eid={meeting_id}',
            'message': 'Meeting created in Google Calendar (simulated)'
        }
    
    def update_meeting(self, meeting_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing meeting in Google Calendar"""
        if not self.authenticated:
            return {'success': False, 'error': 'Not authenticated'}
        
        AuditLogger.log_event('google_calendar_meeting_updated', {
            'meeting_id': meeting_id,
            'updates': list(updates.keys())
        })
        
        return {
            'success': True,
            'meeting_id': meeting_id,
            'message': 'Meeting updated in Google Calendar (simulated)'
        }
    
    def cancel_meeting(self, meeting_id: str) -> Dict[str, Any]:
        """Cancel meeting in Google Calendar"""
        if not self.authenticated:
            return {'success': False, 'error': 'Not authenticated'}
        
        AuditLogger.log_event('google_calendar_meeting_cancelled', {
            'meeting_id': meeting_id
        })
        
        return {
            'success': True,
            'meeting_id': meeting_id,
            'message': 'Meeting cancelled in Google Calendar (simulated)'
        }


class OutlookCalendarAdapter:
    """Adapter for Outlook Calendar API integration"""
    
    def __init__(self, credentials: Optional[Dict[str, Any]] = None):
        """
        Initialize Outlook Calendar adapter
        
        Args:
            credentials: Microsoft Graph API credentials
                        (client_id, client_secret, tenant_id, access_token)
        """
        self.credentials = credentials
        self.authenticated = credentials is not None
    
    def create_meeting(self, meeting: MeetingDetails) -> Dict[str, Any]:
        """
        Create meeting in Outlook Calendar
        
        Note: This is a placeholder implementation. In production:
        1. Use Microsoft Graph API client library
        2. Authenticate with Azure AD
        3. Create calendar event via Graph API
        """
        if not self.authenticated:
            return {
                'success': False,
                'error': 'Outlook Calendar credentials not configured',
                'instructions': 'Please configure OUTLOOK_CALENDAR_CREDENTIALS in environment'
            }
        
        # Placeholder implementation
        meeting_id = f"outlook_{uuid.uuid4()}"
        
        AuditLogger.log_event('outlook_calendar_meeting_created', {
            'meeting_id': meeting_id,
            'title': meeting.title,
            'attendees_count': len(meeting.attendees)
        })
        
        return {
            'success': True,
            'meeting_id': meeting_id,
            'provider': 'outlook',
            'calendar_link': f'https://outlook.office365.com/calendar/view/month',
            'message': 'Meeting created in Outlook Calendar (simulated)'
        }
    
    def update_meeting(self, meeting_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing meeting in Outlook Calendar"""
        if not self.authenticated:
            return {'success': False, 'error': 'Not authenticated'}
        
        AuditLogger.log_event('outlook_calendar_meeting_updated', {
            'meeting_id': meeting_id,
            'updates': list(updates.keys())
        })
        
        return {
            'success': True,
            'meeting_id': meeting_id,
            'message': 'Meeting updated in Outlook Calendar (simulated)'
        }
    
    def cancel_meeting(self, meeting_id: str) -> Dict[str, Any]:
        """Cancel meeting in Outlook Calendar"""
        if not self.authenticated:
            return {'success': False, 'error': 'Not authenticated'}
        
        AuditLogger.log_event('outlook_calendar_meeting_cancelled', {
            'meeting_id': meeting_id
        })
        
        return {
            'success': True,
            'meeting_id': meeting_id,
            'message': 'Meeting cancelled in Outlook Calendar (simulated)'
        }


class MeetingScheduler:
    """Main meeting scheduler with multi-provider support"""
    
    def __init__(self, 
                 google_credentials: Optional[Dict[str, Any]] = None,
                 outlook_credentials: Optional[Dict[str, Any]] = None):
        """
        Initialize meeting scheduler with calendar provider credentials
        
        Args:
            google_credentials: Google Calendar API credentials
            outlook_credentials: Outlook/Microsoft Graph credentials
        """
        self.google_adapter = GoogleCalendarAdapter(google_credentials)
        self.outlook_adapter = OutlookCalendarAdapter(outlook_credentials)
        self.rate_limiter = {}  # In production, use Redis or similar
    
    def check_rate_limit(self, user_id: str, max_requests: int = 10, 
                        window_minutes: int = 60) -> bool:
        """Check rate limiting to prevent abuse"""
        from datetime import timezone
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(minutes=window_minutes)
        
        # Get existing requests for this user
        requests = self.rate_limiter.get(user_id, [])
        
        # Remove requests outside window
        requests = [req_time for req_time in requests if req_time > window_start]
        
        # Check if under limit
        if len(requests) >= max_requests:
            return False
        
        # Add current request
        requests.append(now)
        self.rate_limiter[user_id] = requests
        
        return True
    
    def schedule_meeting(self, meeting_data: Dict[str, Any], 
                        organizer_id: str,
                        provider: CalendarProvider = CalendarProvider.MANUAL) -> Dict[str, Any]:
        """
        Schedule a new meeting
        
        Args:
            meeting_data: Meeting details (title, description, start_time, etc.)
            organizer_id: ID of the user organizing the meeting
            provider: Calendar provider to use (google, outlook, or manual)
        
        Returns:
            Dictionary with success status and meeting details
        """
        try:
            # Check rate limiting
            if not self.check_rate_limit(organizer_id):
                raise ValueError("Rate limit exceeded")
            
            # Parse datetime strings if needed
            start_time = meeting_data.get('start_time')
            if isinstance(start_time, str):
                start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            
            end_time = meeting_data.get('end_time')
            if isinstance(end_time, str):
                end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            
            # Create and validate meeting details
            meeting = MeetingDetails(
                title=meeting_data.get('title', ''),
                description=meeting_data.get('description', ''),
                start_time=start_time,
                end_time=end_time,
                attendees=meeting_data.get('attendees', []),
                organizer=meeting_data.get('organizer', ''),
                location=meeting_data.get('location'),
                calendar_provider=provider
            )
            
            # Route to appropriate provider
            if provider == CalendarProvider.GOOGLE:
                result = self.google_adapter.create_meeting(meeting)
            elif provider == CalendarProvider.OUTLOOK:
                result = self.outlook_adapter.create_meeting(meeting)
            else:
                # Manual scheduling - provide instructions
                meeting_id = f"manual_{uuid.uuid4()}"
                result = {
                    'success': True,
                    'meeting_id': meeting_id,
                    'provider': 'manual',
                    'manual_instructions': self._generate_manual_instructions(meeting),
                    'message': 'Meeting scheduled manually. Follow the instructions below.'
                }
                
                AuditLogger.log_event('manual_meeting_created', {
                    'meeting_id': meeting_id,
                    'title': meeting.title,
                    'attendees_count': len(meeting.attendees)
                })
            
            return result
            
        except ValueError as e:
            AuditLogger.log_event('meeting_scheduling_validation_error', {
                'organizer_id': organizer_id,
                'error_type': type(e).__name__,
                'error_message': str(e)
            })
            
            return {
                'success': False,
                'error': f'Validation error: {str(e)}'
            }
        
        except Exception as e:
            AuditLogger.log_event('meeting_scheduling_error', {
                'organizer_id': organizer_id,
                'error_type': type(e).__name__
            })
            
            return {
                'success': False,
                'error': 'An error occurred while scheduling the meeting.'
            }
    
    def _generate_manual_instructions(self, meeting: MeetingDetails) -> Dict[str, Any]:
        """Generate manual scheduling instructions"""
        return {
            'steps': [
                f"1. Open your calendar application (Google Calendar, Outlook, etc.)",
                f"2. Create a new event with the following details:",
                f"   - Title: {meeting.title}",
                f"   - Start: {meeting.start_time.isoformat()}",
                f"   - End: {meeting.end_time.isoformat()}",
                f"   - Location: {meeting.location or 'N/A'}",
                f"3. Add the following attendees:",
                *[f"   - {attendee}" for attendee in meeting.attendees],
                f"4. Add the description:",
                f"   {meeting.description}",
                f"5. Send the calendar invitations"
            ],
            'template': {
                'title': meeting.title,
                'start_time': meeting.start_time.isoformat(),
                'end_time': meeting.end_time.isoformat(),
                'attendees': meeting.attendees,
                'description': meeting.description,
                'location': meeting.location
            }
        }
    
    def update_meeting(self, meeting_id: str, updates: Dict[str, Any],
                      provider: CalendarProvider) -> Dict[str, Any]:
        """Update an existing meeting"""
        try:
            if provider == CalendarProvider.GOOGLE:
                return self.google_adapter.update_meeting(meeting_id, updates)
            elif provider == CalendarProvider.OUTLOOK:
                return self.outlook_adapter.update_meeting(meeting_id, updates)
            else:
                return {
                    'success': True,
                    'meeting_id': meeting_id,
                    'message': 'Please update the meeting manually in your calendar'
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to update meeting: {str(e)}'
            }
    
    def cancel_meeting(self, meeting_id: str, provider: CalendarProvider) -> Dict[str, Any]:
        """Cancel a meeting"""
        try:
            if provider == CalendarProvider.GOOGLE:
                return self.google_adapter.cancel_meeting(meeting_id)
            elif provider == CalendarProvider.OUTLOOK:
                return self.outlook_adapter.cancel_meeting(meeting_id)
            else:
                return {
                    'success': True,
                    'meeting_id': meeting_id,
                    'message': 'Please cancel the meeting manually in your calendar'
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to cancel meeting: {str(e)}'
            }


# Example usage
if __name__ == "__main__":
    # Initialize scheduler (without credentials for demo)
    scheduler = MeetingScheduler()
    
    # Example: Schedule a follow-up meeting for Contoso Redesign
    meeting_data = {
        'title': '[Contoso Redesign] Wireframes Review Meeting',
        'description': 'Follow-up meeting with design and development teams to review wireframes for the Contoso corporate website redesign project.',
        'start_time': datetime.now() + timedelta(days=7),
        'end_time': datetime.now() + timedelta(days=7, hours=1),
        'attendees': [
            'design-team@contoso.com',
            'dev-team@contoso.com',
            'project-manager@contoso.com'
        ],
        'organizer': 'scheduler@contoso.com',
        'location': 'Conference Room A / Microsoft Teams'
    }
    
    # Schedule with manual process (no API credentials)
    result = scheduler.schedule_meeting(
        meeting_data=meeting_data,
        organizer_id='scheduler@contoso.com',
        provider=CalendarProvider.MANUAL
    )
    
    print(json.dumps(result, indent=2, default=str))
