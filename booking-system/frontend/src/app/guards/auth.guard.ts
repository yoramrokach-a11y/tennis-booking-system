import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Functional Authentication Guard (Angular 20 standard)
 * Ensures user is authenticated before routing to protected paths.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1), // Auto-completes the stream for route resolution
    map(user => {
      if (user) {
        // Optionally check roles if passed as route data: e.g. route.data['role']
        const requiredRole = route.data?.['requiredRole'];
        if (requiredRole && user.role !== requiredRole) {
          router.navigate(['/dashboard']); // Redirect if unauthorized
          return false;
        }
        return true;
      }

      // Store destination URL for redirection post-login
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
};
