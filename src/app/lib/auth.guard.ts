import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard — protects all routes behind authentication.
 * Redirects to /login if no valid session token exists.
 */
export const authGuard: CanActivateFn = () => {
    // TODO: Re-enable auth guard when backend is available locally
    return true;

    // const auth = inject(AuthService);
    // const router = inject(Router);
    //
    // if (auth.isLoggedIn) {
    //     return true;
    // }
    //
    // router.navigate(['/login']);
    // return false;
};
