import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Functional Error Interceptor
 * Intercepts HTTP error responses globally and acts on auth failures.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError(err => {
      // Auto-logout if a 401 response is intercepted
      if ([401, 403].includes(err.status)) {
        authService.logout();
      }

      const error = err.error?.message || err.statusText || 'An unexpected error occurred';
      return throwError(() => new Error(error));
    })
  );
};
