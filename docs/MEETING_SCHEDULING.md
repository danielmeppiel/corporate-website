# Meeting Scheduling Automation

## Overview

The meeting scheduling automation system provides a flexible solution for scheduling, updating, and canceling meetings through multiple calendar providers or a manual process.

## Features

- **Multi-Provider Support**: Google Calendar, Outlook Calendar, and manual scheduling
- **RESTful API**: Easy integration with frontend applications
- **GDPR Compliance**: Audit logging and data validation following existing compliance patterns
- **Rate Limiting**: Protection against abuse
- **Validation**: Comprehensive input validation for security

## API Endpoints

### 1. Schedule a Meeting

**Endpoint**: `POST /api/meetings`

**Request Body**:
```json
{
  "title": "Wireframes Review Meeting",
  "description": "Review wireframes for Contoso redesign",
  "start_time": "2026-02-17T14:00:00Z",
  "end_time": "2026-02-17T15:00:00Z",
  "attendees": [
    "design-team@contoso.com",
    "dev-team@contoso.com"
  ],
  "organizer": "project-manager@contoso.com",
  "location": "Conference Room A",
  "provider": "manual"
}
```

**Response** (Manual scheduling):
```json
{
  "success": true,
  "meeting_id": "manual_550e8400-e29b-41d4-a716-446655440000",
  "provider": "manual",
  "manual_instructions": {
    "steps": [
      "1. Open your calendar application (Google Calendar, Outlook, etc.)",
      "2. Create a new event with the following details:",
      "   - Title: Wireframes Review Meeting",
      "   - Start: 2026-02-17T14:00:00",
      "   - End: 2026-02-17T15:00:00",
      "   - Location: Conference Room A",
      "3. Add the following attendees:",
      "   - design-team@contoso.com",
      "   - dev-team@contoso.com",
      "4. Add the description:",
      "   Review wireframes for Contoso redesign",
      "5. Send the calendar invitations"
    ],
    "template": {
      "title": "Wireframes Review Meeting",
      "start_time": "2026-02-17T14:00:00",
      "end_time": "2026-02-17T15:00:00",
      "attendees": ["design-team@contoso.com", "dev-team@contoso.com"],
      "description": "Review wireframes for Contoso redesign",
      "location": "Conference Room A"
    }
  },
  "message": "Meeting scheduled manually. Follow the instructions below."
}
```

### 2. Get Meeting Details

**Endpoint**: `GET /api/meetings/{meeting_id}`

**Response**:
```json
{
  "meeting_id": "manual_550e8400-e29b-41d4-a716-446655440000",
  "message": "Meeting details retrieval not yet implemented",
  "note": "In production, this would fetch meeting data from storage"
}
```

### 3. Update a Meeting

**Endpoint**: `PATCH /api/meetings/{meeting_id}?provider=manual`

**Request Body**:
```json
{
  "title": "Updated Meeting Title",
  "location": "New Conference Room"
}
```

**Response**:
```json
{
  "success": true,
  "meeting_id": "manual_550e8400-e29b-41d4-a716-446655440000",
  "message": "Please update the meeting manually in your calendar"
}
```

### 4. Cancel a Meeting

**Endpoint**: `DELETE /api/meetings/{meeting_id}?provider=manual`

**Response**:
```json
{
  "success": true,
  "meeting_id": "manual_550e8400-e29b-41d4-a716-446655440000",
  "message": "Please cancel the meeting manually in your calendar"
}
```

### 5. Check Provider Status

**Endpoint**: `GET /api/meetings/providers/status`

**Response**:
```json
{
  "google_calendar": {
    "configured": false,
    "status": "not_configured",
    "message": "Configure GOOGLE_CALENDAR_CREDENTIALS to enable"
  },
  "outlook_calendar": {
    "configured": false,
    "status": "not_configured",
    "message": "Configure OUTLOOK_CALENDAR_CREDENTIALS to enable"
  },
  "manual": {
    "configured": true,
    "status": "ready",
    "message": "Manual scheduling is always available"
  }
}
```

## Configuration

### Manual Scheduling (Default)

No configuration required. The system provides step-by-step instructions for manually creating calendar events.

### Google Calendar Integration

To enable Google Calendar integration:

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Configure the consent screen if prompted
   - Select "Web application" as the application type
   - Add authorized redirect URIs

4. **Set Environment Variables**:
   ```bash
   export GOOGLE_CALENDAR_CLIENT_ID="your-client-id"
   export GOOGLE_CALENDAR_CLIENT_SECRET="your-client-secret"
   export GOOGLE_CALENDAR_REFRESH_TOKEN="your-refresh-token"
   ```

5. **Initialize with Credentials**:
   ```python
   from server.meeting_scheduler import MeetingScheduler
   
   google_creds = {
       'client_id': os.getenv('GOOGLE_CALENDAR_CLIENT_ID'),
       'client_secret': os.getenv('GOOGLE_CALENDAR_CLIENT_SECRET'),
       'refresh_token': os.getenv('GOOGLE_CALENDAR_REFRESH_TOKEN')
   }
   
   scheduler = MeetingScheduler(google_credentials=google_creds)
   ```

### Outlook Calendar Integration

To enable Outlook Calendar integration:

1. **Register an Application in Azure AD**:
   - Go to [Azure Portal](https://portal.azure.com/)
   - Navigate to "Azure Active Directory" > "App registrations"
   - Click "New registration"
   - Set a name and configure redirect URIs

2. **Configure API Permissions**:
   - In your app registration, go to "API permissions"
   - Add "Microsoft Graph" permissions
   - Add "Calendars.ReadWrite" permission
   - Grant admin consent

3. **Create a Client Secret**:
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Save the secret value securely

4. **Set Environment Variables**:
   ```bash
   export OUTLOOK_CALENDAR_CLIENT_ID="your-client-id"
   export OUTLOOK_CALENDAR_CLIENT_SECRET="your-client-secret"
   export OUTLOOK_CALENDAR_TENANT_ID="your-tenant-id"
   export OUTLOOK_CALENDAR_ACCESS_TOKEN="your-access-token"
   ```

5. **Initialize with Credentials**:
   ```python
   from server.meeting_scheduler import MeetingScheduler
   
   outlook_creds = {
       'client_id': os.getenv('OUTLOOK_CALENDAR_CLIENT_ID'),
       'client_secret': os.getenv('OUTLOOK_CALENDAR_CLIENT_SECRET'),
       'tenant_id': os.getenv('OUTLOOK_CALENDAR_TENANT_ID'),
       'access_token': os.getenv('OUTLOOK_CALENDAR_ACCESS_TOKEN')
   }
   
   scheduler = MeetingScheduler(outlook_credentials=outlook_creds)
   ```

## Usage Examples

### Python (Direct Module Usage)

```python
from server.meeting_scheduler import MeetingScheduler, CalendarProvider
from datetime import datetime, timedelta

# Initialize scheduler
scheduler = MeetingScheduler()

# Schedule a meeting
meeting_data = {
    'title': '[Contoso Redesign] Wireframes Review',
    'description': 'Review wireframes with design and development teams',
    'start_time': datetime.now() + timedelta(days=7),
    'end_time': datetime.now() + timedelta(days=7, hours=1),
    'attendees': ['design@contoso.com', 'dev@contoso.com'],
    'organizer': 'pm@contoso.com',
    'location': 'Conference Room A'
}

result = scheduler.schedule_meeting(
    meeting_data=meeting_data,
    organizer_id='pm@contoso.com',
    provider=CalendarProvider.MANUAL
)

print(result)
```

### REST API (cURL)

```bash
# Schedule a meeting
curl -X POST http://localhost:8000/api/meetings \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Wireframes Review Meeting",
    "description": "Review wireframes for Contoso redesign",
    "start_time": "2026-02-17T14:00:00Z",
    "end_time": "2026-02-17T15:00:00Z",
    "attendees": ["design@contoso.com", "dev@contoso.com"],
    "organizer": "pm@contoso.com",
    "location": "Conference Room A",
    "provider": "manual"
  }'

# Check provider status
curl http://localhost:8000/api/meetings/providers/status

# Update a meeting
curl -X PATCH http://localhost:8000/api/meetings/manual_123?provider=manual \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Conference Room B"
  }'

# Cancel a meeting
curl -X DELETE http://localhost:8000/api/meetings/manual_123?provider=manual
```

### JavaScript/TypeScript (Frontend)

```typescript
// Schedule a meeting
async function scheduleMeeting() {
  const response = await fetch('/api/meetings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Wireframes Review Meeting',
      description: 'Review wireframes for Contoso redesign',
      start_time: '2026-02-17T14:00:00Z',
      end_time: '2026-02-17T15:00:00Z',
      attendees: ['design@contoso.com', 'dev@contoso.com'],
      organizer: 'pm@contoso.com',
      location: 'Conference Room A',
      provider: 'manual'
    })
  });
  
  const result = await response.json();
  console.log(result);
}
```

## Manual Process Workflow

When using manual scheduling (the default), the system provides:

1. **Structured Instructions**: Step-by-step guide for creating the calendar event
2. **Event Template**: All meeting details formatted for easy copy-paste
3. **Audit Trail**: All scheduling attempts are logged for compliance

### Example Manual Process

1. System receives scheduling request
2. Validates all meeting details
3. Generates unique meeting ID
4. Creates step-by-step instructions
5. Logs the scheduling attempt
6. Returns instructions to user
7. User follows instructions to create calendar event manually

## Security & Compliance

### Rate Limiting

- **Default Limit**: 10 meetings per hour per user
- **Configurable**: Adjust limits in `MeetingScheduler.check_rate_limit()`
- **Protection**: Prevents abuse and spam

### Data Validation

- Email format validation for all attendees and organizer
- Maximum meeting duration: 8 hours
- Field length limits (title: 200 chars, description: 2000 chars)
- XSS and injection attack prevention

### Audit Logging

All meeting-related events are logged with:
- Unique event ID
- Timestamp
- Event type (created, updated, cancelled)
- User information (organizer ID)
- Meeting details (anonymized where needed)

Logs are stored in `audit.log` following GDPR compliance patterns used elsewhere in the system.

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid email format` | Attendee or organizer email is malformed | Check email format |
| `End time must be after start time` | Invalid time range | Verify start/end times |
| `Rate limit exceeded` | Too many requests | Wait before scheduling more meetings |
| `Meeting duration cannot exceed 8 hours` | Duration too long | Split into multiple meetings |
| `Credentials not configured` | API credentials missing | Configure calendar provider credentials |

### Error Response Format

```json
{
  "success": false,
  "error": "Validation error: Invalid email format"
}
```

## Testing

Run the meeting scheduler with example data:

```bash
cd /home/runner/work/corporate-website/corporate-website
python -m server.meeting_scheduler
```

This will:
1. Initialize the meeting scheduler
2. Schedule a sample meeting for the Contoso Redesign project
3. Display the manual scheduling instructions
4. Log the event to the audit trail

## Future Enhancements

### Planned Features

1. **Database Integration**: Store meeting data persistently
2. **Calendar Synchronization**: Two-way sync with calendar providers
3. **Notification System**: Email reminders and updates
4. **Recurring Meetings**: Support for recurring meeting patterns
5. **Availability Checking**: Check attendee availability before scheduling
6. **Meeting Analytics**: Track meeting metrics and patterns
7. **Calendar Event Templates**: Pre-defined meeting templates
8. **Integration with Video Conferencing**: Auto-create Zoom/Teams links

### Production Considerations

For production deployment:

1. **Use Persistent Storage**: Replace in-memory rate limiter with Redis
2. **Implement OAuth Flow**: Full OAuth 2.0 authentication for calendar providers
3. **Add Webhook Support**: Real-time updates from calendar providers
4. **Enhance Security**: Add authentication/authorization to API endpoints
5. **Add Monitoring**: Track API usage and error rates
6. **Implement Caching**: Cache calendar data to reduce API calls
7. **Add Queue System**: Handle bulk scheduling operations asynchronously

## Support

For issues or questions:
- Check the audit logs in `audit.log`
- Review provider status at `/api/meetings/providers/status`
- Consult the API documentation above
- Contact the development team

## License

MIT License - Same as the corporate-website project
