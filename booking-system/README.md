# Tennis Court Booking System Architecture Blueprint

This blueprint outlines a production-ready, highly modular, and scaleable enterprise architecture for a Tennis Court Booking System. It adheres strictly to the separation of concerns, utilizing industry-standard patterns for both the frontend and backend.

## Tech Stack
*   **Frontend**: Angular 20, Angular Material (UI/UX components), RxJS (Reactive programming).
*   **Backend**: Node.js, Express, TypeScript (Strict typing, modular architecture).
*   **Database**: PostgreSQL (Relational integrity, transactional safety).
*   **API Protocol**: REST API (Standardized JSON payloads, semantic HTTP methods).

---

## Folder Structure Overview

```text
/booking-system/
├── backend/                             # Express + TypeScript Server
│   ├── src/
│   │   ├── config/                      # Connection pools & environment variables
│   │   ├── controllers/                 # HTTP layer (request parsing, response mapping)
│   │   ├── services/                    # Core business logic orchestrators
│   │   ├── repositories/                # Data access layer (PostgreSQL direct queries)
│   │   ├── middleware/                  # Security, Auth, Validation, Errors
│   │   ├── dtos/                        # Data Transfer Objects (Request/Response schemas)
│   │   ├── models/                      # Domain entities and Database model mappings
│   │   ├── routes/                      # REST API routing declarations
│   │   ├── app.ts                       # Express application bootstrap
│   │   └── server.ts                    # Entry point, port binding
│   ├── tsconfig.json
│   └── package.json
└── frontend/                            # Angular 20 Client Application
    ├── src/
    │   ├── app/
    │   │   ├── components/              # Angular UI Views (Booking, Dashboard, Profile)
    │   │   │   ├── booking-form/
    │   │   │   ├── court-list/
    │   │   │   ├── dashboard/
    │   │   │   └── user-profile/
    │   │   ├── services/                # Angular API Client wrappers (RxJS streams)
    │   │   ├── models/                  # Client-side TypeScript interfaces
    │   │   ├── guards/                  # Route activation & Authorization guards
    │   │   ├── app.routes.ts            # Angular client routes
    │   │   ├── app.config.ts            # Core app configuration & DI providers
    │   │   └── app.component.ts         # Shell component
```

---

## Architectural Explanations

### Backend Layers
1.  **Routes (`/routes`)**: Maps incoming HTTP endpoints to their respective Controller methods. Includes middleware injection points (e.g., authentication, rate-limiting, and payload validation).
2.  **Controllers (`/controllers`)**: Acts as the HTTP boundary. Responsible for receiving requests, extracting route params/query parameters/body DTOs, validating simple constraints, calling the appropriate Service method, and sending the correct HTTP response status and payload.
3.  **Services (`/services`)**: The brain of the backend. Contains the domain-level orchestrations (e.g., validating court availability, calculating price, enforcing booking limits per user, sending email notifications). Services are completely decoupled from HTTP concerns.
4.  **Repositories (`/repositories`)**: Responsible for fetching, writing, and updating database records in PostgreSQL. This separates raw SQL queries and transactional logic from business logic.
5.  **DTOs (`/dtos`)**: Data Transfer Objects define the strict shape of payloads entering or leaving our API. Ensures structural validity.
6.  **Models (`/models`)**: Database entity definitions matching the PostgreSQL tables. Represents physical schemas and constraints (indexes, foreign keys).
7.  **Middleware (`/middleware`)**: Handles cross-cutting concerns such as checking JWT tokens, validation of fields (using libraries like Joi or Zod), and global centralized error handling.

### Frontend Layers
1.  **Components (`/components`)**: Smart and Dumb component architecture using Angular 20 standalone elements, standard HTML/CSS templates, and Material elements (e.g., `<mat-card>`, `<mat-datepicker>`).
2.  **Services (`/services`)**: Business logic and HTTP integration points using RxJS. Exposes court/booking data as read-only streams (`Observable<T>`) for UI consumption.
3.  **Models (`/models`)**: Frontend TypeScript types mirroring backend responses and specifying frontend form states.
4.  **Guards (`/guards`)**: Protects client routes from unauthorized navigation (e.g., preventing guests from reaching `/dashboard` or non-admins from reaching `/admin/courts`).
