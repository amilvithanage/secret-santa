# 📚 API Documentation

This document describes the REST API endpoints for the Secret Santa application.

## Base URL

- **Development:** `http://localhost:3000/api`
- **Production:** `https://your-domain.com/api`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🏥 Health Check

### GET /health

Check if the API is running and database is connected.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-07-05T22:21:31.906Z",
    "uptime": 176.380415198,
    "environment": "development",
    "database": "connected"
  }
}
```

---

## 👥 Participants

### GET /participants

Get all participants.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx1234567890",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-07-05T10:00:00.000Z",
      "updatedAt": "2025-07-05T10:00:00.000Z"
    }
  ]
}
```

### POST /participants

Create a new participant.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx1234567891",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "createdAt": "2025-07-05T10:05:00.000Z",
    "updatedAt": "2025-07-05T10:05:00.000Z"
  }
}
```

### GET /participants/:id

Get a specific participant by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-07-05T10:00:00.000Z",
    "updatedAt": "2025-07-05T10:00:00.000Z"
  }
}
```

### PUT /participants/:id

Update a participant.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

### DELETE /participants/:id

Delete a participant.

**Response:**
```json
{
  "success": true,
  "message": "Participant deleted successfully"
}
```

---

## 🎁 Gift Exchanges

### GET /gift-exchanges

Get all gift exchanges.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx2234567890",
      "name": "Office Secret Santa 2025",
      "description": "Annual office Secret Santa exchange",
      "eventDate": "2025-12-25T00:00:00.000Z",
      "registrationDeadline": "2025-12-15T00:00:00.000Z",
      "status": "active",
      "createdAt": "2025-07-05T10:00:00.000Z",
      "updatedAt": "2025-07-05T10:00:00.000Z"
    }
  ]
}
```

### POST /gift-exchanges

Create a new gift exchange.

**Request Body:**
```json
{
  "name": "Office Secret Santa 2025",
  "description": "Annual office Secret Santa exchange",
  "eventDate": "2025-12-25T00:00:00.000Z",
  "registrationDeadline": "2025-12-15T00:00:00.000Z"
}
```

### GET /gift-exchanges/:id

Get a specific gift exchange by ID.

### PUT /gift-exchanges/:id

Update a gift exchange.

### DELETE /gift-exchanges/:id

Delete a gift exchange.

### POST /gift-exchanges/:id/participants

Add a participant to a gift exchange.

**Request Body:**
```json
{
  "participantId": "clx1234567890"
}
```

---

## 🚫 Exclusion Rules

### GET /gift-exchanges/:giftExchangeId/exclusion-rules

Get exclusion rules for a gift exchange.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx3234567890",
      "giftExchangeId": "clx2234567890",
      "excluderId": "clx1234567890",
      "excludedId": "clx1234567891",
      "reason": "married couple",
      "createdAt": "2025-07-05T10:00:00.000Z"
    }
  ]
}
```

### POST /gift-exchanges/:giftExchangeId/exclusion-rules

Create an exclusion rule.

**Request Body:**
```json
{
  "excluderId": "clx1234567890",
  "excludedId": "clx1234567891",
  "reason": "married couple"
}
```

### DELETE /exclusion-rules/:id

Delete an exclusion rule.

### GET /gift-exchanges/:giftExchangeId/exclusion-rules/validate

Validate exclusion rules for a gift exchange.

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "issues": []
  }
}
```

---

## 🎯 Assignments

### POST /gift-exchanges/:id/assignments

Generate assignments for a gift exchange.

**Response:**
```json
{
  "success": true,
  "data": {
    "assignmentCount": 10,
    "message": "Assignments generated successfully"
  }
}
```

### GET /gift-exchanges/:id/assignments

Get assignments for a gift exchange.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx4234567890",
      "giftExchangeId": "clx2234567890",
      "giverId": "clx1234567890",
      "receiverId": "clx1234567891",
      "createdAt": "2025-07-05T10:00:00.000Z"
    }
  ]
}
```

### DELETE /gift-exchanges/:id/assignments

Clear all assignments for a gift exchange.

**Response:**
```json
{
  "success": true,
  "message": "Assignments cleared successfully"
}
```

---

## 🔐 Authentication

### POST /auth/register

Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### POST /auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clx1234567890",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### POST /auth/logout

Logout (invalidate token).

### GET /auth/me

Get current user information (requires authentication).

---

## 📝 Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { /* additional error details */ }
  }
}
```

## 🚨 Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## 📊 Rate Limiting

- **Rate Limit:** 100 requests per minute per IP
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Get participants
curl http://localhost:3000/api/participants

# Create participant
curl -X POST http://localhost:3000/api/participants \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

### Using Make Commands

```bash
# Check API health
make health

# View API logs
make logs-server
```
