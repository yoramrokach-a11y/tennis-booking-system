# AceReserve Tennis Court Booking System - API Documentation

This document contains standard request and response examples for the **AceReserve** authentication endpoints. Use this specification to configure **Postman**, **Insomnia**, or **cURL** queries for development and testing.

---

## Environment Configuration
- **Base URL**: `http://127.0.0.1:5000/api/v1`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN>` *(for protected resources)*

---

## 1. Register a New Account

Creates a new player, staff, or admin account, hashes their password, and immediately issues an active session token.

- **Endpoint**: `POST /auth/register`
- **Authentication**: `None Required`
- **Request Headers**:
  ```http
  Content-Type: application/json
  ```

### Request Body (Player)
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securepassword123",
  "role": "PLAYER"
}
```

### Request Body (Admin)
```json
{
  "name": "Sarah Coach",
  "email": "sarah.c@example.com",
  "password": "adminsecurepassword789",
  "role": "ADMIN"
}
```

### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Registration completed successfully.",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "PLAYER",
      "created_at": "2026-07-02T10:15:30.124Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsInJvbGUiOiJQTEFZRVIiLCJuYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE3ODY5MjE3MzAsImV4cCI6MTc4NzAwODEzMH0.signature"
  }
}
```

### Error Response - Duplicate Email (`400 Bad Request`)
```json
{
  "success": false,
  "error": {
    "code": "ValidationError",
    "message": "A user with this email address already exists."
  }
}
```

### Error Response - Password Too Short (`400 Bad Request`)
```json
{
  "success": false,
  "error": {
    "code": "ValidationError",
    "message": "Password must be at least 6 characters long."
  }
}
```

---

## 2. Authenticate User (Login)

Validates user credentials and delivers a signed JWT session token for authorization.

- **Endpoint**: `POST /auth/login`
- **Authentication**: `None Required`
- **Request Headers**:
  ```http
  Content-Type: application/json
  ```

### Request Body
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Authentication successful.",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "PLAYER",
      "created_at": "2026-07-02T10:15:30.124Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsInJvbGUiOiJQTEFZRVIiLCJuYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE3ODY5MjE3MzAsImV4cCI6MTc4NzAwODEzMH0.signature"
  }
}
```

### Error Response - Bad Credentials (`401 Unauthorized`)
```json
{
  "success": false,
  "error": {
    "code": "UnauthorizedError",
    "message": "Invalid email or password."
  }
}
```

---

## 3. Create a Tennis Court Booking

Reserves an active tennis court for a specific date, start hour, and duration. Calculates prices server-side ($50 per hour) and validates scheduling safety.

- **Endpoint**: `POST /api/bookings` (also supports `POST /api/v1/bookings`)
- **Authentication**: `Bearer <JWT_TOKEN>` (Required)
- **Request Headers**:
  ```http
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

### Request Body
```json
{
  "courtId": 1,
  "bookingDate": "2026-07-05",
  "startHour": 10,
  "hours": 2
}
```

### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Court booked successfully.",
  "bookingId": 4,
  "calculatedPrice": 100,
  "data": {
    "id": 4,
    "userId": 1,
    "courtId": 1,
    "bookingDate": "2026-07-05",
    "startHour": 10,
    "hours": 2,
    "price": 100,
    "createdAt": "2026-07-02T14:22:10.452Z"
  }
}
```

### Error Response - Past Date Booking (`400 Bad Request`)
```json
{
  "success": false,
  "error": {
    "code": "ValidationError",
    "message": "Cannot book a court for a past date."
  }
}
```

### Error Response - Scheduling Overlap (`400 Bad Request`)
```json
{
  "success": false,
  "error": {
    "code": "ValidationError",
    "message": "Overlapping Reservation: The selected court is already booked during this time range."
  }
}
```

---

## 4. Retrieve Bookings List

Fetches all bookings, supporting search and schedules queries using optional filters.

- **Endpoint**: `GET /api/bookings` (also supports `GET /api/v1/bookings`)
- **Authentication**: `Bearer <JWT_TOKEN>` (Required)
- **Query Parameters**:
  - `courtId`: Filter by court identifier (e.g. `1`)
  - `date`: Filter by exact date (e.g. `2026-07-05`)
  - `userId`: Filter by player id (e.g. `1`)

### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "userId": 1,
      "courtId": 1,
      "bookingDate": "2026-07-05",
      "startHour": 10,
      "hours": 2,
      "price": 100,
      "createdAt": "2026-07-02T14:22:10.452Z"
    }
  ]
}
```

---

## 5. Standard cURL Console Templates

### Register Command
```bash
curl -X POST http://127.0.0.1:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Williams",
    "email": "sarah.w@example.com",
    "password": "securepassword123",
    "role": "PLAYER"
  }'
```

### Login Command
```bash
curl -X POST http://127.0.0.1:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah.w@example.com",
    "password": "securepassword123"
  }'
```

### Create Booking Command
```bash
curl -X POST http://127.0.0.1:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{
    "courtId": 1,
    "bookingDate": "2026-07-05",
    "startHour": 14,
    "hours": 2
  }'
```

### Get Bookings Command
```bash
curl -X GET "http://127.0.0.1:5000/api/bookings?courtId=1" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

