import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Functional JWT Interceptor
 * Adds 'Authorization: Bearer <token>' header if a JWT token is stored locally.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};
