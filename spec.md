# Contact Form with Database Storage - Technical Specification

## Overview
Add database-backed contact form functionality to the corporate website following the KISS principle.

## Selected Architecture: Azure Static Web Apps + Functions

### Why This Approach?
- ✅ **Simplest deployment**: Vite frontend already compatible with Static Web Apps
- ✅ **Zero infrastructure**: Serverless, no servers to manage
- ✅ **Cost-effective**: ~$0.50/month for thousands of submissions
- ✅ **Auto-scaling**: Handles traffic spikes automatically
- ✅ **Built-in API**: Azure Functions integrated with Static Web Apps

## Architecture Diagram

```
┌─────────────────────┐
│  Frontend (Vite)    │
│  - index.html       │
│  - Contact Form     │
└──────────┬──────────┘
           │ POST /api/contact
           ↓
┌─────────────────────┐
│  Azure Function     │
│  - Validate input   │
│  - Store data       │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│ Azure Table Storage │
│  - Contact entries  │
└─────────────────────┘
```

## Implementation Plan

### Phase 1: Azure Function API (~20 mins)
**File**: `api/contact/index.js` or `api/contact.js`

**Responsibilities**:
1. Receive POST request with form data
2. Validate required fields (name, email, message)
3. Sanitize input data
4. Store in Azure Table Storage
5. Return success/error response

**Input Schema**:
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "message": "string (required)",
  "timestamp": "ISO 8601 string (auto-generated)"
}
```

**Output Schema**:
```json
{
  "success": true,
  "message": "Contact form submitted successfully",
  "id": "generated-uuid"
}
```

### Phase 2: Frontend Integration (~10 mins)
**File**: `main.js` (modify existing `handleSubmit` function)

**Changes**:
1. Replace alert with API call to `/api/contact`
2. Handle loading states (disable button during submission)
3. Show success/error notifications (already implemented)
4. Reset form on successful submission (already implemented)

### Phase 3: Azure Table Storage Setup (~5 mins)
**Configuration**:
- Storage account: Auto-created by Static Web Apps or manual setup
- Table name: `ContactSubmissions`
- Partition key: `date` (YYYY-MM-DD format)
- Row key: `UUID` (unique submission ID)

**Schema**:
| Field | Type | Description |
|-------|------|-------------|
| PartitionKey | string | Date in YYYY-MM-DD format |
| RowKey | string | UUID for submission |
| name | string | Contact name |
| email | string | Contact email |
| message | string | Contact message |
| timestamp | string | ISO 8601 timestamp |
| userAgent | string | Browser info (truncated) |
| ipHash | string | Hashed IP for compliance |

### Phase 4: Deployment (~5 mins)
**Method**: Azure Static Web Apps CLI or GitHub Actions

**Steps**:
1. Deploy frontend to Static Web Apps
2. Azure Functions auto-deployed with `api/` folder
3. Configure environment variables (storage connection string)
4. Test contact form submission

## Alternative Options (Not Selected)

### Option 2: FastAPI Backend Extension
**Pros**: Leverage existing `backend/api/users.py` structure
**Cons**: Requires container deployment, more infrastructure

### Option 3: Third-Party Service
**Pros**: Zero backend code, instant setup
**Cons**: Data stored externally, less control, recurring costs

## Data Flow

```
1. User fills form → validates client-side
2. Submit button → Loading state
3. POST /api/contact → Azure Function
4. Function validates → sanitizes data
5. Write to Table Storage
6. Return response → Show success/error
7. Reset form (if successful)
```

## Security & Compliance Considerations

### Data Protection (GDPR Compliant)
- ✅ Input sanitization to prevent XSS/injection
- ✅ Email validation (regex pattern)
- ✅ IP hashing for privacy
- ✅ User agent truncation (first 100 chars)
- ✅ HTTPS only (enforced by Static Web Apps)

### Rate Limiting
- Function-level throttling (Azure handles automatically)
- Optional: Add client-side submission cooldown (30 seconds)

### Data Retention
- Implement Azure Storage lifecycle policy
- Auto-delete entries older than 7 years (GDPR requirement)

## Testing Strategy

### Local Development
1. Azure Functions Core Tools for local API testing
2. Mock Table Storage with Azurite emulator
3. Test form validation and error states

### Production Validation
1. Submit test form with valid data
2. Verify entry in Azure Table Storage
3. Test error scenarios (invalid email, missing fields)
4. Verify success/error notifications display correctly

## Success Metrics
- ✅ Contact form submits successfully
- ✅ Data persists in Azure Table Storage
- ✅ User receives success confirmation
- ✅ Error handling works for invalid inputs
- ✅ Accessible (screen reader compatible)
- ✅ GDPR compliant data handling

## Estimated Timeline
- **Phase 1** (Azure Function): 20 minutes
- **Phase 2** (Frontend integration): 10 minutes  
- **Phase 3** (Storage setup): 5 minutes
- **Phase 4** (Deployment): 5 minutes
- **Testing**: 10 minutes

**Total**: ~50 minutes end-to-end

## Dependencies
- Azure subscription (free tier sufficient)
- Azure CLI installed
- Azure Static Web Apps CLI: `npm install -g @azure/static-web-apps-cli`
- Azure Functions Core Tools (for local dev)

## Files to Create/Modify

### New Files
- `api/contact/function.json` - Azure Function configuration
- `api/contact/index.js` - Function logic
- `api/package.json` - Function dependencies

### Modified Files
- `main.js` - Update `handleSubmit` to call API
- `.gitignore` - Add Azure/local settings files

### Configuration Files
- `staticwebapp.config.json` - API routes configuration
- `local.settings.json` - Local development settings (git-ignored)

## Environment Variables
```
AZURE_STORAGE_CONNECTION_STRING=<connection-string>
```

## Monitoring & Observability
- Azure Application Insights (auto-enabled with Static Web Apps)
- Track: submission success rate, error rates, response times
- Log: validation errors, storage failures

---

**Status**: Ready for implementation
**Last Updated**: October 14, 2025
