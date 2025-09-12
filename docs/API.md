# API Documentation

## User Management Endpoints

### GET /users
Retrieve all users from the system.

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe", 
    "email": "john@example.com"
  }
]
```

### POST /users
Create a new user.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```
