# Tennis Court Booking System

🔗 **Live Website:** https://tennis-booking-system-l440.onrender.com

---

# Tennis Court Booking System

## System Overview

The Tennis Court Booking System is a web application that allows users to manage tennis court reservations efficiently. The system provides court availability, booking management, customer management, and secure authentication.

---

# User Roles

```text
Users
│
├── Admin
├── Employee
└── Customer
```

---

# System Structure

```text
Login
  │
  ▼
Dashboard
│
├── Courts
│   ├── Court List
│   ├── Court Details
│   └── Court Availability
│
├── Bookings
│   ├── Booking List
│   ├── Create Booking
│   ├── Edit Booking
│   ├── Booking Details
│   └── Cancel Booking
│
├── Customers
│   ├── Customer List
│   └── Customer Details
│
└── Profile
    └── User Information
```

---

# Navigation Flow

```text
Login
   │
   ▼
Dashboard
   │
   ├────────► Courts
   │              │
   │              ▼
   │       Court Details
   │              │
   │              ▼
   │      Create Booking
   │
   ├────────► Bookings
   │              │
   │              ├────► Booking Details
   │              └────► Edit Booking
   │
   ├────────► Customers
   │              │
   │              ▼
   │      Customer Details
   │
   └────────► Profile
```

---

# Screen Relationships

| Screen | Navigation |
|---------|------------|
| Login | Dashboard |
| Dashboard | Courts |
| Dashboard | Bookings |
| Dashboard | Customers |
| Dashboard | Profile |
| Courts | Court Details |
| Court Details | Create Booking |
| Bookings | Booking Details |
| Booking Details | Edit Booking |
| Customers | Customer Details |

---

# Basic Architecture

```text
+----------------------+
| Angular Frontend     |
|----------------------|
| Components           |
| Pages                |
| Services             |
| Routing              |
+----------+-----------+
           |
           | HTTP / REST API
           |
           ▼
+----------------------+
| Node.js + Express    |
|----------------------|
| Routes               |
| Controllers          |
| Services             |
| Middleware           |
| JWT Authentication   |
+----------+-----------+
           |
           ▼
+----------------------+
| PostgreSQL Database  |
|----------------------|
| Users                |
| Courts               |
| Bookings             |
| Customers            |
+----------------------+
```

---

# Booking Workflow

```text
User Login
      │
      ▼
Dashboard
      │
      ▼
Select Court
      │
      ▼
Check Court Availability
      │
      ▼
Create Booking
      │
      ▼
Send Request to API
      │
      ▼
Validate Request
      │
      ▼
Save Booking
      │
      ▼
Return Success Response
      │
      ▼
Update Booking List
```

---

# Project Structure

```text
Frontend (Angular)
│
├── Components
├── Pages
├── Services
├── Models
└── Routing

Backend (Node.js)
│
├── Routes
├── Controllers
├── Services
├── Middleware
├── Database
└── Configuration

Database
│
├── Users
├── Courts
├── Bookings
└── Customers
```

---

# Technologies

- Angular
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- REST API

---

# Main Features

- User authentication
- Court management
- Court availability
- Create bookings
- Update bookings
- Cancel bookings
- Customer management
- Dashboard
- Responsive user interface
