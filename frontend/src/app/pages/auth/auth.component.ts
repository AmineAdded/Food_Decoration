import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, SignupRequest, LoginRequest } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-background">
        <div class="bg-pattern"></div>
      </div>

      <div class="auth-content">
        <div class="auth-card">
          <!-- Logo -->
          <div class="auth-logo">
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
            <h1>Flower & Flower</h1>
          </div>

          <!-- Tab buttons -->
          <div class="auth-tabs">
            <button
              [class.active]="isLogin()"
              (click)="isLogin.set(true); errorMessage.set('')">
              Connexion
            </button>
            <button
              [class.active]="!isLogin()"
              (click)="isLogin.set(false); errorMessage.set('')">
              Inscription
            </button>
          </div>

          <!-- Error message -->
          <div *ngIf="errorMessage()" class="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ errorMessage() }}
          </div>

          <!-- Login Form -->
          <form *ngIf="isLogin()" class="auth-form" (ngSubmit)="handleLogin()">
            <div class="form-group">
              <label for="login-email">Email</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                  <svg *ngIf="!showPassword()" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg *ngIf="showPassword()" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe">
                <span>Se souvenir de moi</span>
              </label>
              <a (click)="goToForgotPassword()" class="forgot-link">Mot de passe oublié?</a>
            </div>

            <button type="submit" class="submit-btn" [disabled]="isLoading()">
              <span *ngIf="!isLoading()">Se connecter</span>
              <span *ngIf="isLoading()" class="loading-spinner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Connexion...
              </span>
            </button>

            <p class="switch-text">
              Pas encore de compte?
              <a (click)="switchMode()">Créer un compte</a>
            </p>
          </form>

          <!-- Signup Form -->
          <form *ngIf="!isLogin()" class="auth-form" (ngSubmit)="handleSignup()">
            <div class="form-row">
              <div class="form-group">
                <label for="signup-firstname">Prénom</label>
                <input
                  type="text"
                  id="signup-firstname"
                  [(ngModel)]="signupData.firstname"
                  name="firstname"
                  placeholder="Prénom"
                  required>
              </div>

              <div class="form-group">
                <label for="signup-lastname">Nom</label>
                <input
                  type="text"
                  id="signup-lastname"
                  [(ngModel)]="signupData.lastname"
                  name="lastname"
                  placeholder="Nom"
                  required>
              </div>
            </div>

            <div class="form-group">
              <label for="signup-email">Email</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                  <svg *ngIf="!showPassword()" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg *ngIf="showPassword()" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="signup-confirm-password">Confirmer le mot de passe</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                  <svg *ngIf="!showConfirmPassword()" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg *ngIf="showConfirmPassword()" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" class="submit-btn" [disabled]="isLoading()">
              <span *ngIf="!isLoading()">Créer mon compte</span>
              <span *ngIf="isLoading()" class="loading-spinner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Inscription...
              </span>
            </button>

            <p class="switch-text">
              Déjà un compte?
              <a (click)="switchMode()">Se connecter</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      padding: 2rem;
    }

    .auth-background {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #fdfbfb 0%, #f8e9ed 50%, #fef5f7 100%);
      z-index: -1;
    }

    .bg-pattern {
      position: absolute;
      width: 100%;
      height: 100%;
      opacity: 0.1;
      background-image:
        radial-gradient(circle at 20% 30%, rgba(244, 194, 209, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(230, 163, 184, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, rgba(212, 165, 116, 0.2) 0%, transparent 50%);
    }

    .auth-content {
      width: 100%;
      max-width: 480px;
      animation: fadeInUp 0.6s ease-out;
    }

    .auth-card {
      background: white;
      border-radius: 24px;
      padding: 3rem;
      box-shadow:
        0 20px 60px rgba(139, 76, 107, 0.15),
        0 0 0 1px rgba(139, 76, 107, 0.05);
    }

    .auth-logo {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo-circle {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #fef5f7 0%, #f8e9ed 100%);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      box-shadow: 0 8px 24px rgba(244, 194, 209, 0.25);
    }

    .logo-circle svg {
      width: 45px;
      height: 45px;
    }

    .auth-logo h1 {
      font-size: 1.75rem;
      font-weight: 400;
      color: #8b4c6b;
      margin: 0;
      font-family: 'Georgia', serif;
    }

    .auth-tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .auth-tabs button {
      flex: 1;
      padding: 0.875rem;
      background: #f5f5f5;
      border: 2px solid transparent;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      color: #999;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .auth-tabs button:hover {
      background: #f0f0f0;
      color: #666;
    }

    .auth-tabs button.active {
      background: linear-gradient(135deg, #f4c2d1 0%, #e6a3b8 100%);
      color: white;
      border-color: #d4a3b8;
    }

    .error-message {
      background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
      border: 2px solid #ef5350;
      border-radius: 10px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      animation: shake 0.4s ease-in-out;
      color: #c62828;
      font-size: 0.9rem;
    }

    .error-message svg {
      flex-shrink: 0;
      stroke: #d32f2f;
      stroke-width: 2;
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

    .form-group input {
      width: 100%;
      padding: 0.875rem 1rem;
      padding-left: 2.75rem;
      border: 1.5px solid #e8e8e8;
      border-radius: 10px;
      font-size: 0.95rem;
      transition: all 0.3s ease;
      background: #fafafa;
    }

    .input-wrapper input {
      padding-right: 3rem;
    }

    .form-group input:focus,
    .input-wrapper input:focus {
      outline: none;
      border-color: #d4a3b8;
      background: white;
      box-shadow: 0 0 0 3px rgba(212, 163, 184, 0.1);
    }

    .form-group input::placeholder {
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
      justify-content: center;
      transition: color 0.2s ease;
    }

    .toggle-password:hover {
      color: #8b4c6b;
    }

    .toggle-password svg {
      stroke-width: 2;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: #666;
    }

    .remember-me input[type="checkbox"] {
      width: 1rem;
      height: 1rem;
      cursor: pointer;
      accent-color: #d4a3b8;
    }

    .forgot-link {
      color: #a67c96;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .forgot-link:hover {
      color: #8b4c6b;
      text-decoration: underline;
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

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(212, 87, 122, 0.4);
    }

    .submit-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .loading-spinner svg {
      animation: spin 1s linear infinite;
      stroke-width: 2;
    }

    .switch-text {
      text-align: center;
      color: #666;
      font-size: 0.9rem;
      margin-top: 1rem;
    }

    .switch-text a {
      color: #d4577a;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .switch-text a:hover {
      color: #c9688d;
      text-decoration: underline;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes shake {
      0%, 100% {
        transform: translateX(0);
      }
      10%, 30%, 50%, 70%, 90% {
        transform: translateX(-5px);
      }
      20%, 40%, 60%, 80% {
        transform: translateX(5px);
      }
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
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
        width: 60px;
        height: 60px;
      }

      .logo-circle svg {
        width: 38px;
        height: 38px;
      }

      .auth-logo h1 {
        font-size: 1.5rem;
      }

      .form-options {
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
      }
    }
  `]
})
export class AuthComponent {
  isLogin = signal(true);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  rememberMe = false;
  isLoading = signal(false);
  errorMessage = signal('');

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

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  handleLogin() {
    this.errorMessage.set('');
    this.isLoading.set(true);

    const loginRequest: LoginRequest = {
      email: this.loginData.email,
      password: this.loginData.password
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        console.log('Connexion réussie:', response);
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Erreur de connexion:', error);
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Email ou mot de passe incorrect');
      }
    });
  }

  handleSignup() {
    this.errorMessage.set('');

    if (this.signupData.password !== this.signupData.confirmPassword) {
      this.errorMessage.set('Les mots de passe ne correspondent pas');
      return;
    }

    if (this.signupData.password.length < 6) {
      this.errorMessage.set('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    this.isLoading.set(true);

    const signupRequest: SignupRequest = {
      firstname: this.signupData.firstname,
      lastname: this.signupData.lastname,
      email: this.signupData.email,
      phone: this.signupData.phone,
      password: this.signupData.password
    };

    this.authService.signup(signupRequest).subscribe({
      next: (response) => {
        console.log('Inscription réussie:', response);
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Erreur d\'inscription:', error);
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Une erreur s\'est produite lors de l\'inscription');
      }
    });
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  switchMode() {
    this.isLogin.set(!this.isLogin());
    this.errorMessage.set('');
  }
}
