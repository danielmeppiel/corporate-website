"""
Test suite for meeting scheduler functionality
Following compliance and audit requirements
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from server.meeting_scheduler import (
    MeetingScheduler,
    MeetingDetails,
    CalendarProvider,
    GoogleCalendarAdapter,
    OutlookCalendarAdapter,
    AuditLogger
)


class TestMeetingDetails:
    """Test suite for MeetingDetails validation"""
    
    @pytest.fixture
    def valid_meeting_data(self):
        """Valid meeting data for testing"""
        return {
            'title': 'Wireframes Review Meeting',
            'description': 'Review wireframes for Contoso redesign',
            'start_time': datetime.now() + timedelta(days=1),
            'end_time': datetime.now() + timedelta(days=1, hours=1),
            'attendees': ['design@contoso.com', 'dev@contoso.com'],
            'organizer': 'pm@contoso.com',
            'location': 'Conference Room A'
        }
    
    def test_valid_meeting_details(self, valid_meeting_data):
        """Test creation of valid meeting details"""
        meeting = MeetingDetails(**valid_meeting_data)
        
        assert meeting.title == valid_meeting_data['title']
        assert meeting.description == valid_meeting_data['description']
        assert len(meeting.attendees) == 2
        assert meeting.organizer == 'pm@contoso.com'
    
    def test_invalid_title_length(self, valid_meeting_data):
        """Test validation of title length"""
        valid_meeting_data['title'] = 'x' * 201  # Exceeds 200 char limit
        
        with pytest.raises(ValueError, match="Invalid title field"):
            MeetingDetails(**valid_meeting_data)
    
    def test_invalid_description_length(self, valid_meeting_data):
        """Test validation of description length"""
        valid_meeting_data['description'] = 'x' * 2001  # Exceeds 2000 char limit
        
        with pytest.raises(ValueError, match="Invalid description field"):
            MeetingDetails(**valid_meeting_data)
    
    def test_end_time_before_start_time(self, valid_meeting_data):
        """Test validation of time constraints"""
        valid_meeting_data['end_time'] = valid_meeting_data['start_time'] - timedelta(hours=1)
        
        with pytest.raises(ValueError, match="End time must be after start time"):
            MeetingDetails(**valid_meeting_data)
    
    def test_duration_exceeds_limit(self, valid_meeting_data):
        """Test validation of meeting duration limit"""
        valid_meeting_data['end_time'] = valid_meeting_data['start_time'] + timedelta(hours=9)
        
        with pytest.raises(ValueError, match="Meeting duration cannot exceed 8 hours"):
            MeetingDetails(**valid_meeting_data)
    
    def test_empty_attendees_list(self, valid_meeting_data):
        """Test validation of attendees list"""
        valid_meeting_data['attendees'] = []
        
        with pytest.raises(ValueError, match="At least one attendee is required"):
            MeetingDetails(**valid_meeting_data)
    
    def test_invalid_attendee_email(self, valid_meeting_data):
        """Test validation of attendee email format"""
        valid_meeting_data['attendees'] = ['invalid-email']
        
        with pytest.raises(ValueError, match="Invalid email format"):
            MeetingDetails(**valid_meeting_data)
    
    def test_invalid_organizer_email(self, valid_meeting_data):
        """Test validation of organizer email format"""
        valid_meeting_data['organizer'] = 'invalid-email'
        
        with pytest.raises(ValueError, match="Invalid organizer email format"):
            MeetingDetails(**valid_meeting_data)


class TestGoogleCalendarAdapter:
    """Test suite for Google Calendar adapter"""
    
    @pytest.fixture
    def google_adapter_authenticated(self):
        """Create authenticated Google Calendar adapter"""
        credentials = {
            'client_id': 'test_client_id',
            'client_secret': 'test_secret',
            'refresh_token': 'test_token'
        }
        return GoogleCalendarAdapter(credentials)
    
    @pytest.fixture
    def google_adapter_unauthenticated(self):
        """Create unauthenticated Google Calendar adapter"""
        return GoogleCalendarAdapter()
    
    @pytest.fixture
    def sample_meeting(self):
        """Create sample meeting for testing"""
        return MeetingDetails(
            title='Test Meeting',
            description='Test Description',
            start_time=datetime.now() + timedelta(days=1),
            end_time=datetime.now() + timedelta(days=1, hours=1),
            attendees=['test@example.com'],
            organizer='organizer@example.com'
        )
    
    def test_authenticated_adapter(self, google_adapter_authenticated):
        """Test that adapter is authenticated when credentials provided"""
        assert google_adapter_authenticated.authenticated is True
    
    def test_unauthenticated_adapter(self, google_adapter_unauthenticated):
        """Test that adapter is not authenticated without credentials"""
        assert google_adapter_unauthenticated.authenticated is False
    
    def test_create_meeting_authenticated(self, google_adapter_authenticated, sample_meeting):
        """Test creating meeting with authenticated adapter"""
        result = google_adapter_authenticated.create_meeting(sample_meeting)
        
        assert result['success'] is True
        assert 'meeting_id' in result
        assert result['provider'] == 'google'
        assert 'calendar_link' in result
    
    def test_create_meeting_unauthenticated(self, google_adapter_unauthenticated, sample_meeting):
        """Test creating meeting without authentication"""
        result = google_adapter_unauthenticated.create_meeting(sample_meeting)
        
        assert result['success'] is False
        assert 'error' in result
        assert 'credentials not configured' in result['error']
    
    def test_update_meeting_authenticated(self, google_adapter_authenticated):
        """Test updating meeting with authenticated adapter"""
        result = google_adapter_authenticated.update_meeting(
            'test_meeting_id',
            {'title': 'Updated Title'}
        )
        
        assert result['success'] is True
        assert result['meeting_id'] == 'test_meeting_id'
    
    def test_cancel_meeting_authenticated(self, google_adapter_authenticated):
        """Test canceling meeting with authenticated adapter"""
        result = google_adapter_authenticated.cancel_meeting('test_meeting_id')
        
        assert result['success'] is True
        assert result['meeting_id'] == 'test_meeting_id'


class TestOutlookCalendarAdapter:
    """Test suite for Outlook Calendar adapter"""
    
    @pytest.fixture
    def outlook_adapter_authenticated(self):
        """Create authenticated Outlook Calendar adapter"""
        credentials = {
            'client_id': 'test_client_id',
            'client_secret': 'test_secret',
            'tenant_id': 'test_tenant',
            'access_token': 'test_token'
        }
        return OutlookCalendarAdapter(credentials)
    
    @pytest.fixture
    def outlook_adapter_unauthenticated(self):
        """Create unauthenticated Outlook Calendar adapter"""
        return OutlookCalendarAdapter()
    
    @pytest.fixture
    def sample_meeting(self):
        """Create sample meeting for testing"""
        return MeetingDetails(
            title='Test Meeting',
            description='Test Description',
            start_time=datetime.now() + timedelta(days=1),
            end_time=datetime.now() + timedelta(days=1, hours=1),
            attendees=['test@example.com'],
            organizer='organizer@example.com'
        )
    
    def test_authenticated_adapter(self, outlook_adapter_authenticated):
        """Test that adapter is authenticated when credentials provided"""
        assert outlook_adapter_authenticated.authenticated is True
    
    def test_unauthenticated_adapter(self, outlook_adapter_unauthenticated):
        """Test that adapter is not authenticated without credentials"""
        assert outlook_adapter_unauthenticated.authenticated is False
    
    def test_create_meeting_authenticated(self, outlook_adapter_authenticated, sample_meeting):
        """Test creating meeting with authenticated adapter"""
        result = outlook_adapter_authenticated.create_meeting(sample_meeting)
        
        assert result['success'] is True
        assert 'meeting_id' in result
        assert result['provider'] == 'outlook'
        assert 'calendar_link' in result
    
    def test_create_meeting_unauthenticated(self, outlook_adapter_unauthenticated, sample_meeting):
        """Test creating meeting without authentication"""
        result = outlook_adapter_unauthenticated.create_meeting(sample_meeting)
        
        assert result['success'] is False
        assert 'error' in result
        assert 'credentials not configured' in result['error']


class TestMeetingScheduler:
    """Test suite for MeetingScheduler class"""
    
    @pytest.fixture
    def scheduler(self):
        """Create a MeetingScheduler instance for testing"""
        return MeetingScheduler()
    
    @pytest.fixture
    def valid_meeting_data(self):
        """Valid meeting data for testing"""
        return {
            'title': 'Wireframes Review Meeting',
            'description': 'Review wireframes for Contoso redesign',
            'start_time': (datetime.now() + timedelta(days=1)).isoformat(),
            'end_time': (datetime.now() + timedelta(days=1, hours=1)).isoformat(),
            'attendees': ['design@contoso.com', 'dev@contoso.com'],
            'organizer': 'pm@contoso.com',
            'location': 'Conference Room A'
        }
    
    def test_schedule_manual_meeting(self, scheduler, valid_meeting_data):
        """Test scheduling a meeting with manual process"""
        result = scheduler.schedule_meeting(
            meeting_data=valid_meeting_data,
            organizer_id='pm@contoso.com',
            provider=CalendarProvider.MANUAL
        )
        
        assert result['success'] is True
        assert 'meeting_id' in result
        assert result['provider'] == 'manual'
        assert 'manual_instructions' in result
        assert 'steps' in result['manual_instructions']
        assert 'template' in result['manual_instructions']
    
    def test_schedule_google_meeting_no_credentials(self, scheduler, valid_meeting_data):
        """Test scheduling Google Calendar meeting without credentials"""
        result = scheduler.schedule_meeting(
            meeting_data=valid_meeting_data,
            organizer_id='pm@contoso.com',
            provider=CalendarProvider.GOOGLE
        )
        
        assert result['success'] is False
        assert 'credentials not configured' in result['error']
    
    def test_schedule_outlook_meeting_no_credentials(self, scheduler, valid_meeting_data):
        """Test scheduling Outlook Calendar meeting without credentials"""
        result = scheduler.schedule_meeting(
            meeting_data=valid_meeting_data,
            organizer_id='pm@contoso.com',
            provider=CalendarProvider.OUTLOOK
        )
        
        assert result['success'] is False
        assert 'credentials not configured' in result['error']
    
    def test_rate_limiting(self, scheduler, valid_meeting_data):
        """Test rate limiting functionality"""
        organizer_id = 'test_organizer@contoso.com'
        
        # Should allow first 10 requests
        for i in range(10):
            result = scheduler.schedule_meeting(
                meeting_data=valid_meeting_data,
                organizer_id=organizer_id,
                provider=CalendarProvider.MANUAL
            )
            assert result['success'] is True
        
        # 11th request should be rate limited
        result = scheduler.schedule_meeting(
            meeting_data=valid_meeting_data,
            organizer_id=organizer_id,
            provider=CalendarProvider.MANUAL
        )
        assert result['success'] is False
        assert 'Rate limit exceeded' in result['error']
    
    def test_invalid_meeting_data(self, scheduler):
        """Test scheduling with invalid meeting data"""
        invalid_data = {
            'title': 'Test',
            'description': 'Test',
            'start_time': 'invalid_date',
            'end_time': 'invalid_date',
            'attendees': ['invalid-email'],
            'organizer': 'pm@contoso.com'
        }
        
        result = scheduler.schedule_meeting(
            meeting_data=invalid_data,
            organizer_id='pm@contoso.com',
            provider=CalendarProvider.MANUAL
        )
        
        assert result['success'] is False
        assert 'error' in result
    
    def test_update_meeting_manual(self, scheduler):
        """Test updating a manually scheduled meeting"""
        result = scheduler.update_meeting(
            meeting_id='test_meeting_id',
            updates={'title': 'Updated Title'},
            provider=CalendarProvider.MANUAL
        )
        
        assert result['success'] is True
        assert 'Please update the meeting manually' in result['message']
    
    def test_cancel_meeting_manual(self, scheduler):
        """Test canceling a manually scheduled meeting"""
        result = scheduler.cancel_meeting(
            meeting_id='test_meeting_id',
            provider=CalendarProvider.MANUAL
        )
        
        assert result['success'] is True
        assert 'Please cancel the meeting manually' in result['message']
    
    def test_manual_instructions_format(self, scheduler, valid_meeting_data):
        """Test that manual instructions contain all required information"""
        result = scheduler.schedule_meeting(
            meeting_data=valid_meeting_data,
            organizer_id='pm@contoso.com',
            provider=CalendarProvider.MANUAL
        )
        
        instructions = result['manual_instructions']
        
        # Check steps exist
        assert len(instructions['steps']) > 0
        
        # Check template has all required fields
        template = instructions['template']
        assert template['title'] == valid_meeting_data['title']
        assert template['attendees'] == valid_meeting_data['attendees']
        assert template['description'] == valid_meeting_data['description']


class TestAuditLogger:
    """Test suite for audit logging"""
    
    def test_log_event(self):
        """Test that audit events are logged correctly"""
        with patch('server.meeting_scheduler.audit_logger') as mock_logger:
            AuditLogger.log_event(
                'test_event',
                {'data': 'test'},
                user_id='test_user'
            )
            
            # Verify logger was called
            assert mock_logger.info.called
            
            # Check the logged data structure
            call_args = mock_logger.info.call_args[0][0]
            assert 'AUDIT:' in call_args
            assert 'test_event' in call_args
            assert 'test_user' in call_args


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
