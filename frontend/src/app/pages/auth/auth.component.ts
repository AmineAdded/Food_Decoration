import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <!-- Logo -->
        <div class="auth-header">
          <div class="logo-circle">
            <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(40, 40)">
                <circle cx="0" cy="-15" r="8" fill="#f4c2d1"/>
                <circle cx="15" cy="0" r="8" fill="#f4c2d1"/>
                <circle cx="0" cy="15" r="8" fill="#f4c2d1"/>
                <circle cx="-15" cy="0" r="8" fill="#f4c2d1"/>
                <circle cx="10" cy="-10" r="6" fill="#e6a3b8"/>
                <circle cx="10" cy="10" r="6" fill="#e6a3b8"/>
                <circle cx="-10" cy="10" r="6" fill="#e6a3b8"/>
                <circle cx="-10" cy="-10" r="6" fill="#e6a3b8"/>
                <circle cx="0" cy="0" r="8" fill="#d4a574"/>
                <circle cx="0" cy="0" r="5" fill="#e8c99f"/>
              </g>
            </svg>
          </div>
          <h1 class="app-title">Flower & Flower</h1>
        </div>

        <!-- Tabs -->
        <div class="auth-tabs">
          <button
            class="tab"
            [class.active]="isLogin()"
            (click)="isLogin.set(true)">
            Connexion
          </button>
          <button
            class="tab"
            [class.active]="!isLogin()"
            (click)="isLogin.set(false)">
            Inscription
          </button>
        </div>

        <!-- Login Form -->
        <form *ngIf="isLogin()" class="auth-form" (ngSubmit)="handleLogin()">
          <div class="form-group">
            <label for="login-email">Email</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email"
                id="login-email"
                [(ngModel)]="loginData.email"
                name="email"
                placeholder="votre@email.com"
                required>
            </div>
          </div>

          <div class="form-group">
            <label for="login-password">Mot de passe</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="login-password"
                [(ngModel)]="loginData.password"
                name="password"
                placeholder="••••••••"
                required>
              <button
                type="button"
                class="toggle-password"
                (click)="showPassword.set(!showPassword())">
                <svg *ngIf="!showPassword()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg *ngIf="showPassword()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-footer">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe">
              <span>Se souvenir de moi</span>
            </label>
            <a href="javascript:void(0)" class="forgot-link" (click)="goToForgotPassword()">
              Mot de passe oublié?
            </a>
          </div>

          <button type="submit" class="submit-btn">
            Se connecter
          </button>
        </form>

        <!-- Signup Form -->
        <form *ngIf="!isLogin()" class="auth-form" (ngSubmit)="handleSignup()">
          <div class="form-row">
            <div class="form-group">
              <label for="signup-firstname">Prénom</label>
              <div class="input-wrapper">
                <input
                  type="text"
                  id="signup-firstname"
                  [(ngModel)]="signupData.firstname"
                  name="firstname"
                  placeholder="Prénom"
                  required>
              </div>
            </div>

            <div class="form-group">
              <label for="signup-lastname">Nom</label>
              <div class="input-wrapper">
                <input
                  type="text"
                  id="signup-lastname"
                  [(ngModel)]="signupData.lastname"
                  name="lastname"
                  placeholder="Nom"
                  required>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="signup-email">Email</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                type="email"
                id="signup-email"
                [(ngModel)]="signupData.email"
                name="email"
                placeholder="votre@email.com"
                required>
            </div>
          </div>

          <div class="form-group">
            <label for="signup-phone">Téléphone</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <input
                type="tel"
                id="signup-phone"
                [(ngModel)]="signupData.phone"
                name="phone"
                placeholder="+216 XX XXX XXX"
                required>
            </div>
          </div>

          <div class="form-group">
            <label for="signup-password">Mot de passe</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="signup-password"
                [(ngModel)]="signupData.password"
                name="password"
                placeholder="••••••••"
                required>
              <button
                type="button"
                class="toggle-password"
                (click)="showPassword.set(!showPassword())">
                <svg *ngIf="!showPassword()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg *ngIf="showPassword()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="signup-confirm-password">Confirmer le mot de passe</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                [type]="showConfirmPassword() ? 'text' : 'password'"
                id="signup-confirm-password"
                [(ngModel)]="signupData.confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                required>
              <button
                type="button"
                class="toggle-password"
                (click)="showConfirmPassword.set(!showConfirmPassword())">
                <svg *ngIf="!showConfirmPassword()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg *ngIf="showConfirmPassword()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" class="submit-btn">
            S'inscrire
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fdfbfb 0%, #f8e9ed 50%, #fef5f7 100%);
      padding: 2rem 1rem;
    }

    .auth-card {
      background: white;
      border-radius: 20px;
      padding: 2.5rem;
      width: 100%;
      max-width: 450px;
      box-shadow: 0 20px 60px rgba(139, 76, 107, 0.12);
      animation: fadeInUp 0.5s ease-out;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo-circle {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #fef5f7 0%, #f8e9ed 100%);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      box-shadow: 0 8px 24px rgba(244, 194, 209, 0.25);
    }

    .logo-circle svg {
      width: 50px;
      height: 50px;
    }

    .app-title {
      font-size: 1.75rem;
      font-weight: 300;
      color: #8b4c6b;
      margin: 0;
      letter-spacing: 0.03em;
      font-family: 'Georgia', serif;
    }

    .auth-tabs {
      display: flex;
      gap: 0;
      margin-bottom: 2rem;
      background: #f8f8f8;
      border-radius: 12px;
      padding: 4px;
    }

    .tab {
      flex: 1;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      font-size: 0.95rem;
      font-weight: 500;
      color: #a67c96;
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 10px;
    }

    .tab.active {
      background: white;
      color: #8b4c6b;
      box-shadow: 0 2px 8px rgba(139, 76, 107, 0.1);
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #8b4c6b;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      color: #a67c96;
      stroke-width: 2;
      pointer-events: none;
    }

    .input-wrapper input {
      width: 100%;
      padding: 0.875rem 1rem;
      padding-left: 2.75rem;
      border: 1.5px solid #e8e8e8;
      border-radius: 10px;
      font-size: 0.95rem;
      transition: all 0.3s ease;
      background: #fafafa;
    }

    .input-wrapper input:focus {
      outline: none;
      border-color: #d4a3b8;
      background: white;
      box-shadow: 0 0 0 3px rgba(212, 163, 184, 0.1);
    }

    .input-wrapper input::placeholder {
      color: #bbb;
    }

    .toggle-password {
      position: absolute;
      right: 1rem;
      background: none;
      border: none;
      color: #a67c96;
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      transition: color 0.3s ease;
    }

    .toggle-password:hover {
      color: #8b4c6b;
    }

    .form-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #666;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .forgot-link {
      color: #a67c96;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s ease;
    }

    .forgot-link:hover {
      color: #8b4c6b;
    }

    .submit-btn {
      padding: 1rem;
      background: linear-gradient(135deg, #d4577a 0%, #c9688d 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(212, 87, 122, 0.3);
      margin-top: 0.5rem;
    }

    .submit-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(212, 87, 122, 0.4);
    }

    .submit-btn:active {
      transform: translateY(0);
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .auth-card {
        padding: 2rem 1.5rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .logo-circle {
        width: 70px;
        height: 70px;
      }

      .logo-circle svg {
        width: 45px;
        height: 45px;
      }

      .app-title {
        font-size: 1.5rem;
      }
    }
  `]
})
export class AuthComponent {
  isLogin = signal(true);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  rememberMe = false;

  loginData = {
    email: '',
    password: ''
  };

  signupData = {
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  };

  constructor(private router: Router) {}

  handleLogin() {
    console.log('Login:', this.loginData);
  }

  handleSignup() {
    if (this.signupData.password !== this.signupData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    console.log('Signup:', this.signupData);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
