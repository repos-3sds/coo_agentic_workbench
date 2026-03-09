import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export type UserRole =
  | 'MAKER'
  | 'CHECKER'
  | 'APPROVER_RISK'    // RMG-Credit
  | 'APPROVER_MARKET'  // RMG-Market
  | 'APPROVER_FINANCE' // Group Finance
  | 'APPROVER_TAX'     // Group Tax
  | 'APPROVER_LEGAL'   // Legal & Compliance
  | 'APPROVER_OPS'     // T&O-Ops
  | 'APPROVER_TECH'    // T&O-Tech
  | 'COO'              // Final Approval
  | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  email: string;
  department?: string;
  jobTitle?: string;
}

// Map DB department → frontend granular approver role
const DEPARTMENT_ROLE_MAP: Record<string, UserRole> = {
  'RMG-Credit': 'APPROVER_RISK',
  'RMG-Market': 'APPROVER_MARKET',
  'Finance': 'APPROVER_FINANCE',
  'Group Tax': 'APPROVER_TAX',
  'Legal & Compliance': 'APPROVER_LEGAL',
  'Legal, Compliance & Secretariat': 'APPROVER_LEGAL',
  'Operations': 'APPROVER_OPS',
  'Technology': 'APPROVER_TECH',
  'MLR': 'APPROVER_LEGAL',
  'Product Control': 'CHECKER',
  'COO Office': 'COO',
};

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // --- STATE ---
  private _currentUser = signal<UserProfile>(this.buildFromAuth());
  private _allUsers = signal<UserProfile[]>([]);
  private _loaded = signal(false);

  // Public read-only signals
  currentUser = this._currentUser.asReadonly();
  allUsers = this._allUsers.asReadonly();
  loaded = this._loaded.asReadonly();

  // Derived State
  isMaker = computed(() => this.currentUser().role === 'MAKER');
  isApprover = computed(() => this.currentUser().role.startsWith('APPROVER_'));
  isAdmin = computed(() => this.currentUser().role === 'ADMIN');

  constructor() {
    this.loadUsers();

    // Sync with AuthService — when auth user changes, update current user
    this.authService.user$.subscribe(authUser => {
      if (authUser) {
        this._currentUser.set({
          id: authUser.id,
          name: authUser.display_name || authUser.full_name.split(' ')[0],
          email: authUser.email,
          role: this.mapDbRole(authUser.role, authUser.department),
          department: authUser.department,
          jobTitle: authUser.job_title,
        });
      }
    });
  }

  // --- ACTIONS ---

  switchRole(role: UserRole) {
    const users = this._allUsers();
    const match = users.find(u => u.role === role);
    if (match) {
      this._currentUser.set(match);
    } else {
      this._currentUser.set({ ...this._currentUser(), role });
    }
  }

  // --- DATA LOADING ---

  private loadUsers() {
    this.http.get<any[]>('/api/users').subscribe({
      next: (dbUsers) => {
        const mapped: UserProfile[] = dbUsers.map(u => ({
          id: u.id,
          name: u.display_name || u.full_name,
          email: u.email,
          role: this.mapDbRole(u.role, u.department),
          department: u.department,
          jobTitle: u.job_title,
        }));
        this._allUsers.set(mapped);
        this._loaded.set(true);

        // After loading all users, re-sync current user to the logged-in auth user
        // (don't override with first MAKER anymore)
        const authUser = this.authService.currentUser;
        if (authUser) {
          const match = mapped.find(u => u.id === authUser.id || u.email === authUser.email);
          if (match) this._currentUser.set(match);
        }
      },
      error: (err) => {
        console.warn('[UserService] Failed to load users from API, using auth user as fallback', err);
      }
    });
  }

  private mapDbRole(dbRole: string, department: string): UserRole {
    if (dbRole === 'MAKER') return 'MAKER';
    if (dbRole === 'CHECKER') return 'CHECKER';
    if (dbRole === 'COO') return 'COO';
    if (dbRole === 'ADMIN') return 'ADMIN';
    if (dbRole === 'APPROVER') {
      return DEPARTMENT_ROLE_MAP[department] || 'APPROVER_RISK';
    }
    return 'MAKER';
  }

  /** Build initial UserProfile from the JWT-authenticated user in AuthService */
  private buildFromAuth(): UserProfile {
    const authUser = this.authService.currentUser;
    if (authUser) {
      return {
        id: authUser.id,
        name: authUser.display_name || authUser.full_name.split(' ')[0],
        email: authUser.email,
        role: this.mapDbRole(authUser.role, authUser.department),
        department: authUser.department,
        jobTitle: authUser.job_title,
      };
    }
    // Absolute fallback — shown if somehow accessed without login
    return { id: '', name: 'Guest', role: 'MAKER', email: '' };
  }
}
