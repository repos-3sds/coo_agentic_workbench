import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface AuthUser {
    id: string;
    email: string;
    full_name: string;
    display_name: string | null;
    role: string;
    department: string;
    job_title: string;
}

export interface LoginResponse {
    token: string;
    user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);
    private userSubject = new BehaviorSubject<AuthUser | null>(this.loadUser());

    user$ = this.userSubject.asObservable();

    get currentUser(): AuthUser | null {
        return this.userSubject.value;
    }

    get token(): string | null {
        return localStorage.getItem('auth_token');
    }

    get isLoggedIn(): boolean {
        return !!this.token && !!this.currentUser;
    }

    login(userId: string, password?: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>('/api/auth/login', { user_id: userId, password }).pipe(
            tap(res => {
                localStorage.setItem('auth_token', res.token);
                localStorage.setItem('auth_user', JSON.stringify(res.user));
                this.userSubject.next(res.user);
            })
        );
    }

    loginByEmail(email: string, password?: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
            tap(res => {
                localStorage.setItem('auth_token', res.token);
                localStorage.setItem('auth_user', JSON.stringify(res.user));
                this.userSubject.next(res.user);
            })
        );
    }

    logout(): void {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        this.userSubject.next(null);
    }

    private loadUser(): AuthUser | null {
        try {
            const stored = localStorage.getItem('auth_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }
}
