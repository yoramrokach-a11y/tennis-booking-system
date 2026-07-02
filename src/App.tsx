import React, { useState } from 'react';
import { 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Info, 
  Database, 
  Network, 
  BookOpen, 
  Code, 
  Server, 
  Layers, 
  ShieldCheck, 
  Terminal,
  Activity,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Lock,
  UserCheck,
  TrendingUp,
  Sliders,
  Play
} from 'lucide-react';

// ==========================================
// DATA STRUCTURES & BLUEPRINTS
// ==========================================

interface FileSystemItem {
  name: string;
  type: 'folder' | 'file';
  path: string;
  description: string;
  architecturalRole?: string;
  code?: string;
  children?: FileSystemItem[];
}

const fileSystemData: FileSystemItem[] = [
  {
    name: 'booking-system',
    type: 'folder',
    path: '/booking-system',
    description: 'Root folder of the Tennis Court Booking System architecture plan.',
    children: [
      {
        name: 'backend',
        type: 'folder',
        path: '/booking-system/backend',
        description: 'Express.js & Node.js application backend written in modern TypeScript.',
        children: [
          {
            name: 'src',
            type: 'folder',
            path: '/booking-system/backend/src',
            description: 'Main server-side source files.',
            children: [
              {
                name: 'config',
                type: 'folder',
                path: '/booking-system/backend/src/config',
                description: 'Configuration modules managing system constants, environment setups, and database connections.',
                children: [
                  {
                    name: 'db.ts',
                    type: 'file',
                    path: '/booking-system/backend/src/config/db.ts',
                    description: 'Establishes and exports the PostgreSQL connection pool (pg.Pool). Handles client reconnections and query timing logging.',
                    architecturalRole: 'Infrastructure Layer',
                    code: `import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'tennis_court_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // max number of clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const dbPool = new Pool(poolConfig);

dbPool.on('connect', () => {
  console.log('PostgreSQL database pool connected successfully');
});

dbPool.on('error', (err) => {
  console.error('Unexpected database client error', err);
});`
                  }
                ]
              },
              {
                name: 'controllers',
                type: 'folder',
                path: '/booking-system/backend/src/controllers',
                description: 'The API Controller layer. Parses request parameters, performs initial format validation, and formats outputs into standardized REST responses.',
                children: [
                  {
                    name: 'booking.controller.ts',
                    type: 'file',
                    path: '/booking-system/backend/src/controllers/booking.controller.ts',
                    description: 'Maps court-booking requests to appropriate business rules in BookingService.',
                    architecturalRole: 'API Controller Boundary',
                    code: `import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';
import { CreateBookingDto, UpdateBookingDto } from '../dtos/booking.dto';

export class BookingController {
  constructor(private bookingService: BookingService) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const createBookingDto: CreateBookingDto = req.body;
      const userId = req.user?.id; // Parsed from auth JWT middleware

      const newBooking = await this.bookingService.createBooking(userId, createBookingDto);
      
      res.status(201).json({
        success: true,
        data: newBooking
      });
    } catch (error) {
      next(error); // Sent to Global Error Middleware
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        courtId: req.query.courtId ? Number(req.query.courtId) : undefined,
        date: req.query.date as string,
        userId: req.query.userId ? Number(req.query.userId) : undefined
      };

      const bookings = await this.bookingService.getBookings(filters);

      res.status(200).json({
        success: true,
        data: bookings
      });
    } catch (error) {
      next(error);
    }
  };
}`
                  },
                  {
                    name: 'court.controller.ts',
                    type: 'file',
                    path: '/booking-system/backend/src/controllers/court.controller.ts',
                    description: 'Exposes API handlers for managing and listing tennis courts, operational hours, and court-specific rules.',
                    architecturalRole: 'API Controller Boundary',
                    code: `import { Request, Response, NextFunction } from 'express';
import { CourtService } from '../services/court.service';

export class CourtController {
  constructor(private courtService: CourtService) {}

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const courts = await this.courtService.listActiveCourts();
      res.status(200).json({
        success: true,
        data: courts
      });
    } catch (error) {
      next(error);
    }
  };
}`
                  }
                ]
              },
              {
                name: 'services',
                type: 'folder',
                path: '/booking-system/backend/src/services',
                description: 'The Domain/Business Logic layer. Completely unaware of Express, HTTP frameworks, or request headers. Processes transactions, validates slots, and coordinates database mutations.',
                children: [
                  {
                    name: 'booking.service.ts',
                    type: 'file',
                    path: '/booking-system/backend/src/services/booking.service.ts',
                    description: 'Validates court reservation rules, filters double-bookings, checks slots, and verifies timing parameters.',
                    architecturalRole: 'Core Business Service',
                    code: `import { BookingRepository } from '../repositories/booking.repository';
import { CourtRepository } from '../repositories/court.repository';
import { CreateBookingDto } from '../dtos/booking.dto';
import { Booking } from '../models/booking.model';

export class BookingService {
  constructor(
    private bookingRepository: BookingRepository,
    private courtRepository: CourtRepository
  ) {}

  public async createBooking(userId: number, dto: CreateBookingDto): Promise<Booking> {
    // 1. Verify court exists & is operational
    const court = await this.courtRepository.findById(dto.courtId);
    if (!court || !court.isAvailable) {
      throw new Error('The selected tennis court is not available.');
    }

    // 2. Schedule range validation (e.g. 1hr min, 3hr max)
    const durationHours = (new Date(dto.endTime).getTime() - new Date(dto.startTime).getTime()) / (1000 * 60 * 60);
    if (durationHours < 1 || durationHours > 3) {
      throw new Error('Court reservations must be between 1 and 3 hours in duration.');
    }

    // 3. PostgreSQL overlapping concurrency check
    const isOverlapping = await this.bookingRepository.hasOverlappingBooking(
      dto.courtId,
      dto.startTime,
      dto.endTime
    );
    if (isOverlapping) {
      throw new Error('Court is already reserved for the selected timeframe.');
    }

    // 4. Persistence
    return this.bookingRepository.create({
      userId,
      courtId: dto.courtId,
      startTime: dto.startTime,
      endTime: dto.endTime,
      status: 'CONFIRMED'
    });
  }
}`
                  }
                ]
              },
              {
                name: 'repositories',
                type: 'folder',
                path: '/booking-system/backend/src/repositories',
                description: 'The Data Access layer. Isolates SQL syntax, parameters, and query bindings from the rest of the application.',
                children: [
                  {
                    name: 'booking.repository.ts',
                    type: 'file',
                    path: '/booking-system/backend/src/repositories/booking.repository.ts',
                    description: 'Manages bookings table CRUD operations in PostgreSQL. Uses relational parameters to prevent SQL Injection.',
                    architecturalRole: 'Data Access Object',
                    code: `import { Pool } from 'pg';
import { Booking } from '../models/booking.model';

export class BookingRepository {
  constructor(private db: Pool) {}

  public async create(data: any): Promise<Booking> {
    const query = \`
      INSERT INTO bookings (user_id, court_id, start_time, end_time, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id as "userId", court_id as "courtId", start_time as "startTime", end_time as "endTime", status
    \`;
    const values = [data.userId, data.courtId, data.startTime, data.endTime, data.status];
    const res = await this.db.query(query, values);
    return res.rows[0];
  }

  public async hasOverlappingBooking(courtId: number, start: Date, end: Date): Promise<boolean> {
    const query = \`
      SELECT EXISTS (
        SELECT 1 FROM bookings
        WHERE court_id = $1 
          AND status != 'CANCELLED'
          AND tsrange(start_time, end_time) && tsrange($2, $3)
      )
    \`;
    const res = await this.db.query(query, [courtId, start, end]);
    return res.rows[0].exists;
  }
}`
                  }
                ]
              },
              {
                name: 'middleware',
                type: 'folder',
                path: '/booking-system/backend/src/middleware',
                description: 'Intermediate HTTP interceptors for checking auth headers, validating payloads, and catching system errors.',
                children: [
                  {
                    name: 'auth.middleware.ts',
                    type: 'file',
                    path: '/booking-system/backend/src/middleware/auth.middleware.ts',
                    description: 'Validates JWT tokens, extracts claims, and binds user records to the express request.',
                    architecturalRole: 'Security Guard Interceptor',
                    code: `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized access. Token is missing.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded; // Augments request scope safely
    next();
  } catch (error) {
    res.status(403).json({ message: 'Forbidden. Invalid session token.' });
  }
}`
                  },
                  {
                    name: 'error.middleware.ts',
                    type: 'file',
                    path: '/booking-system/backend/src/middleware/error.middleware.ts',
                    description: 'Handles server-wide failures, hides internal database traces in production, and standardizes client error payloads.',
                    architecturalRole: 'System Safety Net',
                    code: `import { Request, Response, NextFunction } from 'express';

export function globalErrorHandler(
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  console.error('[Global Error Interceptor]:', err.stack);

  const isDev = process.env.NODE_ENV !== 'production';
  const status = (err as any).statusCode || 500;
  
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected operational failure occurred.',
    stack: isDev ? err.stack : undefined
  });
}`
                  }
                ]
              },
              {
                name: 'dtos',
                type: 'folder',
                path: '/booking-system/backend/src/dtos',
                description: 'Data Transfer Objects (DTOs). Classes/Interfaces specifying compile-time structural formats for incoming client queries.',
                children: [
                  {
                    name: 'booking.dto.ts',
                    type: 'file',
                    path: '/booking-system/backend/src/dtos/booking.dto.ts',
                    description: 'Defines input shapes for reserving and updating courts.',
                    architecturalRole: 'Validation contract',
                    code: `export interface CreateBookingDto {
  courtId: number;
  startTime: Date;
  endTime: Date;
}

export interface UpdateBookingDto {
  status: 'CONFIRMED' | 'CANCELLED';
}`
                  }
                ]
              },
              {
                name: 'models',
                type: 'folder',
                path: '/booking-system/backend/src/models',
                description: 'TypeScript database entity maps matching database table rows.',
                children: [
                  {
                    name: 'booking.model.ts',
                    type: 'file',
                    path: '/booking-system/backend/src/models/booking.model.ts',
                    description: 'Maps the bookings entity structure.',
                    architecturalRole: 'Domain model entity',
                    code: `export interface Booking {
  id: number;
  userId: number;
  courtId: number;
  startTime: Date;
  endTime: Date;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}`
                  }
                ]
              },
              {
                name: 'routes',
                type: 'folder',
                path: '/booking-system/backend/src/routes',
                description: 'Declares HTTP endpoints and couples them with corresponding Controllers.',
                children: [
                  {
                    name: 'booking.routes.ts',
                    type: 'file',
                    path: '/booking-system/backend/src/routes/booking.routes.ts',
                    description: 'Exposes POST, GET, PATCH routing endpoints and hooks middleware pipelines.',
                    architecturalRole: 'Route orchestrator',
                    code: `import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export function getBookingRouter(controller: BookingController): Router {
  const router = Router();

  // Protect all booking actions
  router.use(authMiddleware);

  router.post('/', controller.create);
  router.get('/', controller.getAll);
  router.patch('/:id', controller.updateStatus);

  return router;
}`
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        name: 'frontend',
        type: 'folder',
        path: '/booking-system/frontend',
        description: 'Angular 20 Standalone client dashboard. Modern template layouts driven by RxJS reactives.',
        children: [
          {
            name: 'src',
            type: 'folder',
            path: '/booking-system/frontend/src',
            description: 'Source files for the Angular application, hosting components, route configurations, services, and styling assets.',
            children: [
              {
                name: 'app',
                type: 'folder',
                path: '/booking-system/frontend/src/app',
                description: 'Primary Angular client module directory containing components, views, models, and controllers.',
                children: [
                  {
                    name: 'components',
                    type: 'folder',
                    path: '/booking-system/frontend/src/app/components',
                    description: 'Reusable views. Combines Angular HTML, TS logic, and CSS styles.',
                    children: [
                      {
                        name: 'booking-form',
                        type: 'folder',
                        path: '/booking-system/frontend/src/app/components/booking-form',
                        description: 'Contains form component for making a reservation with a date picker.',
                        children: [
                          {
                            name: 'booking-form.component.ts',
                            type: 'file',
                            path: '/booking-system/frontend/src/app/components/booking-form/booking-form.component.ts',
                            description: 'Binds Material DatePicker values and dispatches booking events.',
                            architecturalRole: 'UI Component Logic',
                            code: `import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatButtonModule, MatDatepickerModule],
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.css']
})
export class BookingFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bookingService = inject(BookingService);

  bookingForm = this.fb.group({
    courtId: [null, [Validators.required]],
    date: [new Date(), [Validators.required]],
    slot: ['', [Validators.required]]
  });

  ngOnInit(): void {}

  onSubmit() {
    if (this.bookingForm.valid) {
      this.bookingService.createBooking(this.bookingForm.value as any).subscribe({
        next: (res) => console.log('Successfully Reserved!'),
        error: (err) => alert(err.message)
      });
    }
  }
}`
                          }
                        ]
                      }
                    ]
                  },
                  {
                    name: 'services',
                    type: 'folder',
                    path: '/booking-system/frontend/src/app/services',
                    description: 'Injectable API data handlers using RxJS HttpClient observables.',
                    children: [
                      {
                        name: 'booking.service.ts',
                        type: 'file',
                        path: '/booking-system/frontend/src/app/services/booking.service.ts',
                        description: 'Exposes HTTP calls to backend bookings controller as RxJS Observables.',
                        architecturalRole: 'Angular API Client Service',
                        code: `import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Booking } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/bookings';

  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  public bookings$ = this.bookingsSubject.asObservable();

  public loadBookings(date: string): void {
    this.http.get<{ data: Booking[] }>(this.apiUrl, { params: { date } }).pipe(
      map(res => res.data),
      tap(list => this.bookingsSubject.next(list))
    ).subscribe();
  }

  public createBooking(dto: any): Observable<Booking> {
    return this.http.post<{ data: Booking }>(this.apiUrl, dto).pipe(
      map(res => res.data),
      tap(booking => {
        const current = this.bookingsSubject.getValue();
        this.bookingsSubject.next([booking, ...current]);
      })
    );
  }
}`
                      }
                    ]
                  },
                  {
                    name: 'guards',
                    type: 'folder',
                    path: '/booking-system/frontend/src/app/guards',
                    description: 'Router Guards protecting authenticated routes from unauthorized navigation.',
                    children: [
                      {
                        name: 'auth.guard.ts',
                        type: 'file',
                        path: '/booking-system/frontend/src/app/guards/auth.guard.ts',
                        description: 'Functional route check assessing credentials before loading protected UI templates.',
                        architecturalRole: 'Route Navigation Guard',
                        code: `import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user) return true;
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
};`
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

// ==========================================
// REST ENDPOINT SCHEMAS
// ==========================================

const apiEndpoints = [
  {
    category: 'Bookings API',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/bookings',
        description: 'Reserve a tennis court slot.',
        auth: 'Bearer JWT (User role)',
        requestBody: `{
  "courtId": 4,
  "startTime": "2026-07-05T10:00:00.000Z",
  "endTime": "2026-07-05T12:00:00.000Z"
}`,
        successResponse: `{
  "success": true,
  "data": {
    "id": 142,
    "userId": 24,
    "courtId": 4,
    "startTime": "2026-07-05T10:00:00.000Z",
    "endTime": "2026-07-05T12:00:00.000Z",
    "status": "CONFIRMED",
    "createdAt": "2026-07-02T01:00:00.000Z"
  }
}`,
        errorResponse: `{
  "success": false,
  "message": "The selected court is already booked during this time interval."
}`
      },
      {
        method: 'GET',
        path: '/api/v1/bookings',
        description: 'Query bookings list with filters.',
        auth: 'Bearer JWT',
        queryParams: 'courtId (optional), userId (optional), date (optional: YYYY-MM-DD)',
        successResponse: `{
  "success": true,
  "data": [
    {
      "id": 142,
      "userId": 24,
      "courtId": 4,
      "startTime": "2026-07-05T10:00:00.000Z",
      "endTime": "2026-07-05T12:00:00.000Z",
      "status": "CONFIRMED"
    }
  ]
}`
      },
      {
        method: 'PATCH',
        path: '/api/v1/bookings/:id',
        description: 'Modify or cancel a booking.',
        auth: 'Bearer JWT (Owner / Admin)',
        requestBody: `{
  "status": "CANCELLED"
}`,
        successResponse: `{
  "success": true,
  "data": {
    "id": 142,
    "status": "CANCELLED",
    "updatedAt": "2026-07-02T01:15:00.000Z"
  }
}`
      }
    ]
  },
  {
    category: 'Courts API',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/courts',
        description: 'Retrieve lists of all available tennis courts and surfaces.',
        auth: 'None Required',
        successResponse: `{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Wimbledon Center Court",
      "surface": "GRASS",
      "isAvailable": true,
      "hourlyRate": 35.00
    },
    {
      "id": 2,
      "name": "Clay Court 1",
      "surface": "CLAY",
      "isAvailable": true,
      "hourlyRate": 25.00
    }
  ]
}`
      }
    ]
  }
];

// ==========================================
// DATABASE RELATION SCHEMAS
// ==========================================

const dbTables = [
  {
    name: 'users',
    description: 'System accounts for players and administrators.',
    columns: [
      { name: 'id', type: 'SERIAL (PK)', constraints: 'PRIMARY KEY' },
      { name: 'email', type: 'VARCHAR(150)', constraints: 'UNIQUE, NOT NULL' },
      { name: 'password_hash', type: 'VARCHAR(255)', constraints: 'NOT NULL' },
      { name: 'full_name', type: 'VARCHAR(100)', constraints: 'NOT NULL' },
      { name: 'role', type: 'VARCHAR(20)', constraints: "DEFAULT 'PLAYER'" },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()' }
    ]
  },
  {
    name: 'courts',
    description: 'The physical tennis courts available for reservation.',
    columns: [
      { name: 'id', type: 'SERIAL (PK)', constraints: 'PRIMARY KEY' },
      { name: 'name', type: 'VARCHAR(50)', constraints: 'NOT NULL, UNIQUE' },
      { name: 'surface', type: 'VARCHAR(20)', constraints: "NOT NULL (e.g. 'GRASS', 'CLAY', 'HARD')" },
      { name: 'is_available', type: 'BOOLEAN', constraints: "DEFAULT TRUE" },
      { name: 'hourly_rate', type: 'NUMERIC(10,2)', constraints: 'NOT NULL' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()' }
    ]
  },
  {
    name: 'bookings',
    description: 'Reserved court segments linked to users and courts.',
    columns: [
      { name: 'id', type: 'SERIAL (PK)', constraints: 'PRIMARY KEY' },
      { name: 'user_id', type: 'INTEGER (FK)', constraints: 'REFERENCES users(id) ON DELETE CASCADE' },
      { name: 'court_id', type: 'INTEGER (FK)', constraints: 'REFERENCES courts(id) ON DELETE CASCADE' },
      { name: 'start_time', type: 'TIMESTAMP', constraints: 'NOT NULL' },
      { name: 'end_time', type: 'TIMESTAMP', constraints: 'NOT NULL' },
      { name: 'status', type: 'VARCHAR(20)', constraints: "DEFAULT 'CONFIRMED' (or 'CANCELLED')" },
      { name: 'created_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()' },
      { name: 'updated_at', type: 'TIMESTAMP', constraints: 'DEFAULT NOW()' }
    ]
  }
];

// ==========================================
// CORE APP COMPONENT
// ==========================================

export default function App() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'flow' | 'api' | 'db' | 'guide'>('explorer');
  
  // File tree status state
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({
    '/booking-system': true,
    '/booking-system/backend': true,
    '/booking-system/backend/src': true,
    '/booking-system/frontend': true,
    '/booking-system/frontend/src': true,
    '/booking-system/frontend/src/app': true,
  });
  
  const [selectedPath, setSelectedPath] = useState<string>('/booking-system');
  const [selectedItem, setSelectedItem] = useState<FileSystemItem>(fileSystemData[0]);

  // Helper to toggle directory view
  const toggleFolder = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPaths(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleSelectItem = (item: FileSystemItem) => {
    setSelectedPath(item.path);
    setSelectedItem(item);
  };

  // Recursive Tree Rendering inside Sidebar (Slate-900 style)
  const renderTree = (items: FileSystemItem[], depth: number = 0) => {
    return (
      <ul className="space-y-1">
        {items.map(item => {
          const isExpanded = expandedPaths[item.path];
          const isSelected = selectedPath === item.path;
          const isFolder = item.type === 'folder';

          return (
            <li key={item.path} style={{ paddingLeft: `${depth * 8}px` }}>
              <div 
                className={`flex items-center justify-between py-2 px-2.5 rounded-lg cursor-pointer group transition-all duration-150 ${
                  isSelected 
                    ? 'bg-emerald-600 text-white font-medium shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                onClick={() => handleSelectItem(item)}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  {isFolder ? (
                    <button 
                      onClick={(e) => toggleFolder(item.path, e)}
                      className={`text-slate-500 hover:text-slate-300 focus:outline-none transition-colors ${isSelected ? 'text-white' : ''}`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="w-3.5" /> // Align with toggle spacer
                  )}

                  {isFolder ? (
                    <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-400'}`} />
                  ) : (
                    <File className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-sky-400'}`} />
                  )}

                  <span className="text-xs font-mono truncate">{item.name}</span>
                </div>
              </div>

              {isFolder && isExpanded && item.children && (
                <div className="mt-1">
                  {renderTree(item.children, depth + 1)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      
      {/* ==========================================
          SIDEBAR (Professional Polish Theme)
          ========================================== */}
      <aside className="w-80 bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0">
        
        {/* Sidebar Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center font-bold text-slate-950 italic">A</div>
          <span className="text-lg font-bold tracking-tight text-white">
            AceReserve <span className="text-emerald-400">Pro</span>
          </span>
        </div>

        {/* Directory Listing */}
        <div className="flex-1 py-6 px-4 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Architecture Explorer</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10 font-mono">
              v20.0
            </span>
          </div>

          <div className="space-y-1">
            {renderTree(fileSystemData)}
          </div>
        </div>

        {/* Sidebar Footer context card */}
        <div className="p-4 bg-slate-850/60 rounded-xl m-4 border border-slate-800 shrink-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">Active Blueprint Context</p>
          <div className="text-xs text-slate-300 space-y-1 font-mono leading-tight">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>/src/app/core/guards</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>/src/app/shared/models</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>/api/v1/controllers</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT AREA
          ========================================== */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        
        {/* Content Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold text-slate-900 capitalize flex items-center gap-2">
              {activeTab === 'explorer' && 'Structure Explorer'}
              {activeTab === 'flow' && 'Request Lifecycle'}
              {activeTab === 'api' && 'REST APIs Spec'}
              {activeTab === 'db' && 'Database Schema'}
              {activeTab === 'guide' && 'Architecture Guide'}
            </h1>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500 font-medium font-mono">Boilerplate Blueprint</span>
          </div>

          {/* Navigation Tab Menu */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'explorer' 
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              Files
            </button>
            <button 
              onClick={() => setActiveTab('flow')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'flow' 
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Lifecycle
            </button>
            <button 
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'api' 
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              APIs
            </button>
            <button 
              onClick={() => setActiveTab('db')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'db' 
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Database
            </button>
            <button 
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'guide' 
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guide
            </button>
          </div>

          {/* User badge JD on Right to match Mock */}
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs text-slate-400 font-mono hidden md:inline">2026-07-02</span>
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center overflow-hidden shadow-sm">
              <span className="text-xs font-bold text-emerald-700">JD</span>
            </div>
          </div>
        </header>

        {/* Main interactive area with professional light theme styling */}
        <div className="p-8 flex-1 overflow-y-auto space-y-8">
          
          {/* STATS OVERVIEW HEADER CARD (Matches mockup layout details) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Design Specification Mode</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-950">Enterprise Blueprint</h3>
              <p className="text-emerald-600 text-xs mt-2 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Strict Separation of Concerns Active
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Architecture Stack</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-950">Angular 20 + Express</h3>
              <p className="text-slate-500 text-xs mt-2">Durable storage: PostgreSQL</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Structural Quality</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-950">Safe Exclusions</h3>
              <p className="text-amber-600 text-xs mt-2 font-semibold">TSRANGE constraint configured</p>
            </div>
          </div>

          {/* ==========================================
              TAB SUB-PAGES
              ========================================== */}
          
          {/* Tab 1: Structure Explorer */}
          {activeTab === 'explorer' && (
            <div className="space-y-6">
              
              {/* Main explorer card details */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 font-mono font-bold px-2 py-0.5 rounded">
                        {selectedItem.type.toUpperCase()}
                      </span>
                      {selectedItem.architecturalRole && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                          {selectedItem.architecturalRole}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-slate-900 font-mono mt-1">{selectedItem.name}</h2>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{selectedItem.path}</span>
                </div>

                <div className="p-6 space-y-6">
                  {/* File Role Detail block */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" /> Responsibilities in Booking Flow
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedItem.description}
                    </p>
                  </div>

                  {/* Blueprint Code View */}
                  {selectedItem.code ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                          <Code className="w-3.5 h-3.5 text-sky-500" />
                          Strict Boilerplate Contract Definition
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Clean Code Only</span>
                      </div>
                      <div className="relative rounded-xl border border-slate-800 bg-slate-900 overflow-hidden font-mono shadow-md">
                        <div className="bg-slate-950 px-4 py-2 flex items-center justify-between border-b border-slate-800 shrink-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{selectedItem.name}</span>
                        </div>
                        <pre className="p-5 text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[450px] overflow-y-auto">
                          <code>{selectedItem.code}</code>
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50 space-y-2">
                      <Folder className="w-8 h-8 text-slate-300 mx-auto" />
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Directory Container</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Please select an individual file from the AceReserve architecture tree in the left sidebar to inspect its static typescript structural codes.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Request Flow */}
          {activeTab === 'flow' && (
            <div className="space-y-8">
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <h2 className="text-lg font-bold text-slate-900">System Transaction & Validation Flow</h2>
                <p className="text-xs text-slate-500">
                  How data flows sequentially across layers to maintain high isolation and validation constraints.
                </p>
              </div>

              {/* Graphic Flow Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Step 1 */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative space-y-4">
                  <div className="absolute -top-3 left-4 bg-sky-500 text-slate-950 font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow">
                    PHASE 01: COMPONENT
                  </div>
                  <div className="flex items-center space-x-2 text-sky-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Client Form</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    User requests scheduling via the Angular Material card UI component. Dispatches request parameters via RxJS http client.
                  </p>
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>HttpClient payload</span>
                    <span>RxJS Pipe</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative space-y-4">
                  <div className="absolute -top-3 left-4 bg-violet-500 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow">
                    PHASE 02: GATEKEEPER
                  </div>
                  <div className="flex items-center space-x-2 text-violet-600">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Middleware</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    API endpoint middleware authenticates the incoming JWT header token, decrypting safe user properties, and parsing the body format.
                  </p>
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Auth Interceptor</span>
                    <span>JWT claims</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative space-y-4">
                  <div className="absolute -top-3 left-4 bg-amber-500 text-slate-950 font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow">
                    PHASE 03: CONTROLLER
                  </div>
                  <div className="flex items-center space-x-2 text-amber-600">
                    <Server className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">HTTP Boundary</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Express Controllers map paths, extract body elements, check parameter parameters, and forward values into the internal logic pipelines.
                  </p>
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Express router</span>
                    <span>REST maps</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative space-y-4">
                  <div className="absolute -top-3 left-4 bg-emerald-500 text-slate-950 font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow">
                    PHASE 04: LOGIC
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Domain Service</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Evaluates rule schedules: prevents double-booking, asserts court availability, validates opening hours, and calculates rate formulas.
                  </p>
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Clean Business Domain</span>
                    <span>Overlaps assert</span>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative space-y-4">
                  <div className="absolute -top-3 left-4 bg-pink-500 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow">
                    PHASE 05: PERSISTENCE
                  </div>
                  <div className="flex items-center space-x-2 text-pink-600">
                    <Database className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Repository</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Performs atomic queries with direct parameter binding to write transactions directly into PostgreSQL relational cells securely.
                  </p>
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>pg Pool query</span>
                    <span>Atomicity OK</span>
                  </div>
                </div>

              </div>

              {/* Grid schedule preview container inside flow tab (matches mockup grid visual elements) */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Interactive Schedule Grid Preview</h2>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300"></div> Confirmed
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <div className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-300"></div> Training
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 text-[10px] font-bold text-slate-400">
                    <button className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-600">Prev</button>
                    <button className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-800">Today</button>
                    <button className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-600">Next</button>
                  </div>
                </div>
                
                <div className="overflow-hidden grid grid-cols-[140px_1fr]">
                  {/* Court labels list */}
                  <div className="border-r border-slate-100 divide-y divide-slate-100 text-xs font-semibold text-slate-700 bg-slate-50/20">
                    <div className="h-10"></div>
                    <div className="h-16 flex items-center px-4">Centre Court</div>
                    <div className="h-16 flex items-center px-4 bg-slate-150/10">Court 1 (Clay)</div>
                    <div className="h-16 flex items-center px-4">Court 2 (Hard)</div>
                  </div>

                  {/* Columns of time */}
                  <div className="relative flex flex-col divide-y divide-slate-100">
                    <div className="h-10 flex items-center text-[10px] font-bold text-slate-400 border-b border-slate-100">
                      <div className="flex-1 text-center">09:00</div>
                      <div className="flex-1 text-center">10:00</div>
                      <div className="flex-1 text-center">11:00</div>
                      <div className="flex-1 text-center">12:00</div>
                      <div className="flex-1 text-center">13:00</div>
                      <div className="flex-1 text-center">14:00</div>
                    </div>

                    <div className="flex-1 divide-y divide-slate-100 relative">
                      {/* Rows */}
                      <div className="h-16 relative bg-slate-50/20">
                        <div className="absolute left-[16.6%] top-1.5 bottom-1.5 w-[33%] bg-emerald-50 border border-emerald-300 rounded p-1.5 overflow-hidden shadow-xs">
                          <p className="text-[10px] font-bold text-emerald-800">S. Williams v M. Sharapova</p>
                          <p className="text-[9px] text-emerald-600">Tournament Match</p>
                        </div>
                      </div>
                      <div className="h-16 relative">
                        <div className="absolute left-[50%] top-1.5 bottom-1.5 w-[16.6%] bg-blue-50 border border-blue-300 rounded p-1.5 overflow-hidden shadow-xs">
                          <p className="text-[10px] font-bold text-blue-800">R. Federer</p>
                          <p className="text-[9px] text-blue-600">Coaching Slot</p>
                        </div>
                      </div>
                      <div className="h-16 relative bg-slate-50/20">
                        <div className="absolute left-[0%] top-1.5 bottom-1.5 w-[16.6%] bg-emerald-50 border border-emerald-300 rounded p-1.5 overflow-hidden shadow-xs">
                          <p className="text-[10px] font-bold text-emerald-800">N. Djokovic</p>
                        </div>
                        <div className="absolute left-[66.6%] top-1.5 bottom-1.5 w-[16.6%] bg-emerald-50 border border-emerald-300 rounded p-1.5 overflow-hidden shadow-xs">
                          <p className="text-[10px] font-bold text-emerald-800">C. Alcaraz</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Tab 3: REST API SPEC */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <h2 className="text-base font-bold text-slate-900">REST API Specification</h2>
                <p className="text-xs text-slate-500">JSON schema contracts defining interactions between the Angular service layers and Express endpoints.</p>
              </div>

              {apiEndpoints.map((category, idx) => (
                <div key={idx} className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> {category.category}
                  </h3>
                  
                  <div className="space-y-4">
                    {category.endpoints.map((ep, epIdx) => (
                      <div key={epIdx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        
                        {/* API Route summary */}
                        <div className="bg-slate-50 px-5 py-3.5 flex flex-wrap items-center gap-3 border-b border-slate-100">
                          <span className={`text-[10px] font-bold font-mono px-2 py-1 rounded shadow-xs ${
                            ep.method === 'POST' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            ep.method === 'GET' ? 'bg-sky-100 text-sky-800 border border-sky-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {ep.method}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-800">{ep.path}</span>
                          <span className="text-xs text-slate-500 shrink-0">— {ep.description}</span>
                          
                          <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded ml-auto font-mono font-semibold">
                            {ep.auth}
                          </span>
                        </div>

                        {/* Request parameters / details code views */}
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {ep.requestBody && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Payload body DTO Schema</span>
                              <pre className="bg-slate-900 text-slate-300 p-3 rounded-lg border border-slate-850 text-[10px] font-mono overflow-x-auto">
                                {ep.requestBody}
                              </pre>
                            </div>
                          )}
                          {ep.queryParams && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Allowed query parameters</span>
                              <div className="bg-slate-50 text-slate-700 p-3.5 rounded-lg border border-slate-200 text-xs font-mono">
                                {ep.queryParams}
                              </div>
                            </div>
                          )}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Success output payload (200 OK)</span>
                            <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg border border-slate-850 text-[10px] font-mono overflow-x-auto">
                              {ep.successResponse}
                            </pre>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              ))}

            </div>
          )}

          {/* Tab 4: Database ERD */}
          {activeTab === 'db' && (
            <div className="space-y-6">
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <h2 className="text-base font-bold text-slate-900">Relational Database Schemas</h2>
                <p className="text-xs text-slate-500">PostgreSQL physical table models mapping to domain repositories.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dbTables.map((table, tIdx) => (
                  <div key={tIdx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    
                    {/* Header */}
                    <div className="bg-slate-900 px-4 py-3.5 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold font-mono text-white">{table.name}</span>
                      </div>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Table</span>
                    </div>

                    <div className="p-3 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 italic">
                      {table.description}
                    </div>

                    {/* Columns table representation */}
                    <div className="p-4 flex-1 space-y-3">
                      {table.columns.map((col, cIdx) => (
                        <div key={cIdx} className="flex justify-between text-xs items-start font-mono border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                          <div className="space-y-0.5">
                            <span className="text-slate-800 font-semibold">{col.name}</span>
                            <div className="text-[9px] text-slate-400 font-normal">{col.constraints}</div>
                          </div>
                          <span className="text-emerald-600 shrink-0 text-right font-medium">{col.type}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>

              {/* Exclusion safety blocks */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Concurrency Guard Exclusions</span>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed">
                  To prevent double-booking conditions, we use PostgreSQL range exclusions with the <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">btree_gist</code> extension. 
                  This rejects overlapping booking queries before saving data to disk.
                </p>

                <div className="relative rounded-lg border border-slate-800 bg-slate-900 overflow-hidden font-mono">
                  <pre className="p-4 text-[10px] text-slate-300 overflow-x-auto leading-relaxed">
{`-- Enable constraint helper extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Bookings overlapping safety validation
ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_court_bookings
EXCLUDE USING gist (
  court_id WITH =,
  tsrange(start_time, end_time) WITH &&
);`}
                  </pre>
                </div>
              </div>

            </div>
          )}

          {/* Tab 5: Architecture Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <h2 className="text-base font-bold text-slate-900">Full Stack Engineering Standards</h2>
                <p className="text-xs text-slate-500">Design guidelines and directory rules used for this Court Reservation blueprint.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Angular 20 Standalone</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    By importing imports directly within each component class annotation rather than declaring visual files inside modules, standalone elements keep compiling boundaries decoupled, clean, and extremely fast.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Reactive streams with RxJS</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Components fetch, display, or update records using streams and async pipes. This maintains UI rendering synchronized without leaving open intervals or manual unsubscribe calls in typescript memory.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Decoupled Repository Pattern</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Business rules in the services are decoupled from the query syntax. If the system changes databases, only the raw repository implementation code switches. The core validation logic remains safe.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-700 flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Safe Data Transfer DTOs</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Strict contracts are enforced on API entry points. This prevents client changes from breaking data flow formats, raising errors instantly during compiling.
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>

      </main>

    </div>
  );
}
