import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="forgot-container">
      <div class="forgot-background">
        <div class="bg-pattern"></div>
      </div>

      <div class="forgot-content">
        <div class="forgot-card">
          <!-- Back button -->
          <button class="back-btn" (click)="goBack()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Retour
          </button>

          <!-- Logo -->
          <div class="forgot-logo">
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
          </div>

          <h2 class="forgot-title">Mot de passe oublié?</h2>
          <p class="forgot-description">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          <!-- Email sent message -->
          <div *ngIf="emailSent()" class="success-message">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p>Un email de réinitialisation a été envoyé à votre adresse.</p>
          </div>

          <!-- Form -->
          <form *ngIf="!emailSent()" class="forgot-form" (ngSubmit)="handleSubmit()">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                placeholder="votre@email.com"
                required>
            </div>

            <button type="submit" class="submit-btn">
              Envoyer le lien
            </button>
          </form>

          <button *ngIf="emailSent()" class="submit-btn" (click)="goBack()">
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forgot-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      padding: 2rem;
    }

    .forgot-background {
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

    .forgot-content {
      width: 100%;
      max-width: 480px;
      animation: fadeInUp 0.6s ease-out;
    }

    .forgot-card {
      background: white;
      border-radius: 24px;
      padding: 3rem;
      box-shadow:
        0 20px 60px rgba(139, 76, 107, 0.15),
        0 0 0 1px rgba(139, 76, 107, 0.05);
      position: relative;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: #a67c96;
      font-size: 0.9rem;
      cursor: pointer;
      padding: 0.5rem;
      margin-bottom: 1.5rem;
      transition: color 0.3s ease;
    }

    .back-btn:hover {
      color: #8b4c6b;
    }

    .forgot-logo {
      text-align: center;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: center;
    }

    .logo-circle {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #fef5f7 0%, #f8e9ed 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(244, 194, 209, 0.25);
    }

    .logo-circle svg {
      width: 45px;
      height: 45px;
    }

    .forgot-title {
      font-size: 1.8rem;
      font-weight: 400;
      color: #8b4c6b;
      text-align: center;
      margin: 0 0 1rem 0;
      font-family: 'Georgia', serif;
    }

    .forgot-description {
      text-align: center;
      color: #a67c96;
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .success-message {
      background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%);
      border: 2px solid #81c784;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      animation: slideIn 0.4s ease-out;
    }

    .success-message svg {
      flex-shrink: 0;
      stroke: #66bb6a;
      stroke-width: 2;
    }

    .success-message p {
      margin: 0;
      color: #2e7d32;
      line-height: 1.5;
    }

    .forgot-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
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

    .form-group input:focus {
      outline: none;
      border-color: #d4a3b8;
      background: white;
      box-shadow: 0 0 0 3px rgba(212, 163, 184, 0.1);
    }

    .form-group input::placeholder {
      color: #bbb;
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
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .forgot-card {
        padding: 2rem 1.5rem;
      }

      .forgot-logo svg {
        width: 60px;
        height: 60px;
      }

      .forgot-title {
        font-size: 1.5rem;
      }
    }
  `]
})
export class ForgotPasswordComponent {
  email = '';
  emailSent = signal(false);

  constructor(private router: Router) {}

  handleSubmit() {
    console.log('Reset password for:', this.email);
    // Add your password reset logic here
    this.emailSent.set(true);
  }

  goBack() {
    this.router.navigate(['/auth']);
  }
}
