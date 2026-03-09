import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface QuickUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  jobTitle: string;
  color: string;
  initials: string;
}

const QUICK_USERS: QuickUser[] = [
  { id: 'usr-001', name: 'Sarah Chen', email: 'sarah.chen@mbs.com', role: 'MAKER', department: 'Treasury & Markets', jobTitle: 'VP, Product Management', color: '#22c55e', initials: 'SC' },
  { id: 'usr-002', name: 'James Wilson', email: 'james.wilson@mbs.com', role: 'CHECKER', department: 'Risk Management', jobTitle: 'Director, Risk Analytics', color: '#f59e0b', initials: 'JW' },
  { id: 'usr-003', name: 'Maria Rodriguez', email: 'maria.rodriguez@mbs.com', role: 'APPROVER', department: 'Legal & Compliance', jobTitle: 'MD, Compliance', color: '#3b82f6', initials: 'MR' },
  { id: 'usr-004', name: 'David Kim', email: 'david.kim@mbs.com', role: 'COO', department: 'COO Office', jobTitle: 'Chief Operating Officer', color: '#a855f7', initials: 'DK' },
  { id: 'usr-005', name: 'Emily Thompson', email: 'emily.thompson@mbs.com', role: 'ADMIN', department: 'Technology & Ops', jobTitle: 'Platform Administrator', color: '#ef4444', initials: 'ET' },
];

const ROLE_LABELS: Record<string, string> = {
  MAKER: 'Product Proposer',
  CHECKER: 'Risk Reviewer',
  APPROVER: 'Compliance Approver',
  COO: 'COO / Executive',
  ADMIN: 'Platform Admin',
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="login-root">

  <!-- ─── Left: Brand Panel ─────────────────────────────────── -->
  <div class="brand-panel">
    <div class="brand-overlay"></div>
    <div class="brand-content">
      <div class="brand-logo">
        <img src="assets/logos/Expanded_Logo.svg" alt="COO Workbench" class="brand-logo-img" />
        <div class="brand-title-group">
          <span class="brand-name">MBS Bank</span>
          <span class="brand-sub">COO Agentic Workbench</span>
        </div>
      </div>

      <div class="brand-headline">
        <h1>COO<br><span>Command Center</span></h1>
        <p>AI-powered multi-agent workbench for COO workflows — NPA automation, approvals, escalations, and monitoring from initiation to post-launch review.</p>
      </div>

      <div class="feature-pills">
        <div class="pill">
          <span class="pill-icon material-symbols-outlined" aria-hidden="true">bolt</span>
          <span>NPA Automation</span>
        </div>
        <div class="pill">
          <span class="pill-icon material-symbols-outlined" aria-hidden="true">security</span>
          <span>Risk & Compliance</span>
        </div>
        <div class="pill">
          <span class="pill-icon material-symbols-outlined" aria-hidden="true">fact_check</span>
          <span>Approvals & Sign-off</span>
        </div>
        <div class="pill">
          <span class="pill-icon material-symbols-outlined" aria-hidden="true">monitoring</span>
          <span>Monitoring & PIR</span>
        </div>
      </div>

      <div class="brand-footer">
        <span class="brand-badge">Live More, Bank Less</span>
      </div>
    </div>
  </div>

  <!-- ─── Right: Login Panel ───────────────────────────────── -->
  <div class="login-panel">
    <div class="login-card">

      <!-- Header -->
      <div class="login-header">
        <div class="login-logo-sm">
          <img src="assets/logos/Collapsed_Logo.svg" alt="COO Workbench" class="login-logo-img" />
        </div>
        <div>
          <h2 class="login-title">Welcome back</h2>
          <p class="login-subtitle">Sign in to your workbench</p>
        </div>
      </div>

      <!-- ── Tab Switch ── -->
      <div class="tab-switch">
        <button class="tab-btn" [class.active]="!showQuickLogin" (click)="showQuickLogin = false">
          <span>Email & Password</span>
        </button>
        <button class="tab-btn" [class.active]="showQuickLogin" (click)="showQuickLogin = true">
          <span>Quick Login</span>
        </button>
        <div class="tab-indicator" [style.transform]="showQuickLogin ? 'translateX(100%)' : 'translateX(0)'"></div>
      </div>

      <!-- ── Email Form ── -->
      @if (!showQuickLogin) {
        <form class="email-form" (ngSubmit)="loginWithEmail()">
          <div class="field-group">
            <label class="field-label">Email Address</label>
            <div class="field-wrap">
              <span class="field-icon">
                <span class="material-symbols-outlined" aria-hidden="true">mail</span>
              </span>
              <input
                class="field-input"
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="name@mbs.com"
                autocomplete="email"
                [disabled]="loading"
                required />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Password</label>
            <div class="field-wrap">
              <span class="field-icon">
                <span class="material-symbols-outlined" aria-hidden="true">lock</span>
              </span>
              <input
                class="field-input"
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                placeholder="MBS@2026"
                autocomplete="current-password"
                [disabled]="loading" />
              <button type="button" class="pw-toggle" (click)="showPassword = !showPassword">
                @if (showPassword) {
                  <span class="material-symbols-outlined" aria-hidden="true">visibility_off</span>
                } @else {
                  <span class="material-symbols-outlined" aria-hidden="true">visibility</span>
                }
              </button>
            </div>
            <p class="field-hint">Demo password: <strong>MBS&#64;2026</strong> (or leave blank)</p>
          </div>

          @if (error) {
            <div class="error-box">
              <span class="material-symbols-outlined" aria-hidden="true">error</span>
              <span>{{ error }}</span>
            </div>
          }

          <button type="submit" class="submit-btn" [disabled]="loading || !email">
            @if (loading) {
              <span class="spinner"></span>
              <span>Signing in...</span>
            } @else {
              <span class="material-symbols-outlined" aria-hidden="true">login</span>
              <span>Sign In</span>
            }
          </button>
        </form>
      }

      <!-- ── Quick Login ── -->
      @if (showQuickLogin) {
        <div class="quick-list">
          <p class="quick-hint">Select a persona to sign in instantly</p>
          @for (user of quickUsers; track user.id) {
            <button
              class="quick-user-btn"
              [class.selected]="selectedQuickUser?.id === user.id"
              (click)="selectQuick(user)"
              [disabled]="loading">
              <div class="avatar" [style.background]="user.color + '20'" [style.color]="user.color">
                {{ user.initials }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ user.name }}</span>
                <span class="user-meta">{{ user.department }} · {{ roleLabel(user.role) }}</span>
              </div>
              <span class="role-badge" [style.background]="user.color + '15'" [style.color]="user.color">
                {{ user.role }}
              </span>
              @if (selectedQuickUser?.id === user.id) {
                <span class="check-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" fill="#22c55e" stroke="none"/><polyline points="9 12 11 14 15 10" stroke="white"/></svg>
                </span>
              }
            </button>
          }

          @if (error) {
            <div class="error-box">
              <span class="material-symbols-outlined" aria-hidden="true">error</span>
              <span>{{ error }}</span>
            </div>
          }

          <button
            class="submit-btn"
            [disabled]="!selectedQuickUser || loading"
            (click)="loginWithUser()">
            @if (loading) {
              <span class="spinner"></span>
              <span>Signing in...</span>
            } @else {
              <span class="material-symbols-outlined" aria-hidden="true">login</span>
              <span>{{ selectedQuickUser ? 'Sign in as ' + selectedQuickUser.name : 'Select a user to continue' }}</span>
            }
          </button>
        </div>
      }

      <!-- Footer -->
      <p class="login-footer">
        © 2026 MBS Bank Ltd · COO Workbench v2.0 · Demo Environment
      </p>

    </div>
  </div>
</div>
    `,
  styles: [`
:host { display: block; }

/* ─── Layout ──────────────────────────────────────────────────────── */
.login-root {
  display: flex;
  min-height: 100vh;
  background: #f1f5f9;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ─── Brand Panel ─────────────────────────────────────────────────── */
.brand-panel {
  flex: 1;
  position: relative;
  background:
    linear-gradient(135deg, rgba(10,20,60,0.97) 0%, rgba(26,0,5,0.92) 50%, rgba(10,5,40,0.97) 100%),
    url('https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80') center/cover no-repeat;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.brand-overlay {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 30% 60%, rgba(208,30,42,0.15) 0%, transparent 70%);
  pointer-events: none;
}

/* Animated shimmer grid */
.brand-panel::before {
  content: '';
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

.brand-content {
  position: relative; z-index: 1;
  padding: 48px 56px;
  display: flex; flex-direction: column; gap: 48px;
}

.brand-logo {
  display: flex; align-items: center; gap: 14px;
}
.brand-logo-img {
  height: 48px;
  width: auto;
  max-width: 220px;
  display: block;
}
.brand-title-group { display: flex; flex-direction: column; }
.brand-name {
  font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.3px;
}
.brand-sub {
  font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.45); letter-spacing: 0.5px;
  text-transform: uppercase;
}

.brand-headline h1 {
  font-size: clamp(28px, 3vw, 40px); font-weight: 800; color: #fff;
  line-height: 1.15; letter-spacing: -1px; margin: 0 0 16px;
}
.brand-headline h1 span { color: #D01E2A; }
.brand-headline p {
  font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.7;
  max-width: 380px; margin: 0;
}

.feature-pills {
  display: flex; flex-wrap: wrap; gap: 10px;
}
.pill {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px; padding: 6px 14px;
  font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.75);
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}
.pill:hover { background: rgba(255,255,255,0.1); }
.pill-icon { font-size: 14px; }
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
  line-height: 1;
}

.brand-footer { margin-top: auto; }
.brand-badge {
  display: inline-block;
  background: rgba(208,30,42,0.15);
  border: 1px solid rgba(208,30,42,0.3);
  color: #ff8a8a;
  border-radius: 6px; padding: 6px 14px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* ─── Login Panel ─────────────────────────────────────────────────── */
.login-panel {
  width: 480px; min-width: 480px;
  display: flex; align-items: center; justify-content: center;
  background: #f1f5f9;
  padding: 32px 24px;
}

.login-card {
  width: 100%; max-width: 420px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 40px -10px rgba(0,0,0,0.12);
  padding: 36px;
  display: flex; flex-direction: column; gap: 24px;
}

/* ─── Login Header ─────────────────────────────────────────────────── */
.login-header {
  display: flex; align-items: center; gap: 14px;
}
.login-logo-sm { display: flex; align-items: center; }
.login-logo-img {
  height: 36px;
  width: auto;
  display: block;
}
.login-title {
  font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;
}
.login-subtitle {
  font-size: 13px; color: #94a3b8; margin: 2px 0 0; font-weight: 400;
}

/* ─── Tabs ─────────────────────────────────────────────────────────── */
.tab-switch {
  display: grid; grid-template-columns: 1fr 1fr;
  background: #f1f5f9; border-radius: 12px; padding: 4px;
  position: relative; overflow: hidden;
}
.tab-btn {
  position: relative; z-index: 1;
  background: none; border: none; cursor: pointer;
  padding: 9px 12px; border-radius: 9px;
  font-size: 13px; font-weight: 500; color: #64748b;
  transition: color 0.2s; white-space: nowrap;
}
.tab-btn.active { color: #0f172a; font-weight: 600; }
.tab-indicator {
  position: absolute; top: 4px; bottom: 4px;
  left: 4px; width: calc(50% - 4px);
  background: #fff;
  border-radius: 9px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
  pointer-events: none;
}

/* ─── Email Form ───────────────────────────────────────────────────── */
.email-form { display: flex; flex-direction: column; gap: 18px; }

.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label {
  font-size: 12px; font-weight: 600; color: #374151; letter-spacing: 0.3px;
  text-transform: uppercase;
}
.field-wrap {
  position: relative; display: flex; align-items: center;
}
.field-icon {
  position: absolute; left: 14px; color: #9ca3af; display: flex;
  pointer-events: none;
}
.field-input {
  width: 100%; padding: 12px 14px 12px 42px;
  border: 1.5px solid #e5e7eb; border-radius: 10px;
  font-size: 14px; color: #0f172a; background: #fafafa;
  outline: none; transition: all 0.2s; box-sizing: border-box;
  font-family: inherit;
}
.field-input:focus {
  border-color: #D01E2A; background: #fff;
  box-shadow: 0 0 0 3px rgba(208,30,42,0.08);
}
.field-input:disabled { opacity: 0.6; cursor: not-allowed; }
.pw-toggle {
  position: absolute; right: 12px;
  background: none; border: none; cursor: pointer;
  color: #9ca3af; display: flex; padding: 4px;
  border-radius: 6px; transition: color 0.15s;
}
.pw-toggle:hover { color: #374151; }
.field-hint { font-size: 11px; color: #9ca3af; margin: 2px 0 0; }
.field-hint strong { color: #D01E2A; }

/* ─── Error Box ─────────────────────────────────────────────────────── */
.error-box {
  display: flex; align-items: center; gap: 8px;
  background: #fef2f2; border: 1px solid #fecaca;
  border-radius: 10px; padding: 10px 14px;
  color: #dc2626; font-size: 13px; font-weight: 500;
}

/* ─── Submit Button ─────────────────────────────────────────────────── */
.submit-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 13px;
  background: #D01E2A; color: #fff;
  border: none; border-radius: 11px; cursor: pointer;
  font-size: 14px; font-weight: 600; font-family: inherit;
  transition: all 0.2s; letter-spacing: 0.1px;
  box-shadow: 0 4px 14px rgba(208,30,42,0.35);
}
.submit-btn:hover:not(:disabled) {
  background: #b51922;
  box-shadow: 0 6px 20px rgba(208,30,42,0.45);
  transform: translateY(-1px);
}
.submit-btn:disabled {
  opacity: 0.5; cursor: not-allowed;
  transform: none; box-shadow: none;
}
.spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  animation: spin 0.7s linear infinite; flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Quick Login ───────────────────────────────────────────────────── */
.quick-list { display: flex; flex-direction: column; gap: 10px; }
.quick-hint { font-size: 12px; color: #94a3b8; margin: 0; }

.quick-user-btn {
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: 11px 14px;
  background: #f8fafc; border: 1.5px solid #e2e8f0;
  border-radius: 12px; cursor: pointer; text-align: left;
  transition: all 0.18s; position: relative;
}
.quick-user-btn:hover:not(:disabled) {
  border-color: #D01E2A; background: #fff;
  box-shadow: 0 2px 12px rgba(208,30,42,0.08);
}
.quick-user-btn.selected {
  border-color: #D01E2A; background: #fff9f9;
  box-shadow: 0 0 0 3px rgba(208,30,42,0.08);
}
.quick-user-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.avatar {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; flex-shrink: 0;
  letter-spacing: 0.5px;
}
.user-info { flex: 1; min-width: 0; }
.user-name {
  display: block; font-size: 13px; font-weight: 600; color: #0f172a;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.user-meta {
  display: block; font-size: 11px; color: #94a3b8;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.role-badge {
  font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
  padding: 3px 8px; border-radius: 5px; white-space: nowrap; flex-shrink: 0;
}
.check-icon { flex-shrink: 0; display: flex; }

/* ─── Footer ─────────────────────────────────────────────────────────── */
.login-footer {
  font-size: 11px; color: #cbd5e1; text-align: center; margin: 0;
}

/* ─── Responsive: collapse brand panel on small screens ────────────── */
@media (max-width: 900px) {
  .brand-panel { display: none; }
  .login-panel { width: 100%; min-width: unset; }
}
    `]
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  showQuickLogin = false;
  showPassword = false;

  email = '';
  password = '';

  selectedQuickUser: QuickUser | null = null;
  quickUsers = QUICK_USERS;

  loading = false;
  error = '';

  ngOnInit() {
    if (this.auth.isLoggedIn) {
      this.router.navigate(['/']);
    }
  }

  roleLabel(role: string): string {
    return ROLE_LABELS[role] || role;
  }

  selectQuick(user: QuickUser) {
    this.selectedQuickUser = user;
    this.error = '';
  }

  loginWithEmail() {
    if (!this.email) return;
    this.loading = true;
    this.error = '';
    this.auth.loginByEmail(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Login failed. Please check your credentials.';
      }
    });
  }

  loginWithUser() {
    if (!this.selectedQuickUser) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.selectedQuickUser.id).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Login failed.';
      }
    });
  }
}
