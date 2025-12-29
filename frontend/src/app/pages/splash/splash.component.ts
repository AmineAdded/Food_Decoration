import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-container">
      <div class="splash-content">
        <div class="logo-container">
          <div class="logo-circle">
            <svg class="logo" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
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
        <h1 class="app-name">Flower & Flower</h1>
        <p class="tagline">L'art de la décoration florale</p>
      </div>
    </div>
  `,
  styles: [`
    .splash-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      background: linear-gradient(135deg, #fdfbfb 0%, #f8e9ed 50%, #fef5f7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease-in;
    }

    .splash-content {
      text-align: center;
      animation: scaleIn 0.5s ease-out;
    }

    .logo-container {
      margin-bottom: 2rem;
      display: flex;
      justify-content: center;
    }

    .logo-circle {
      width: 120px;
      height: 120px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 40px rgba(244, 194, 209, 0.3);
      animation: float 2s ease-in-out infinite;
    }

    .logo {
      width: 80px;
      height: 80px;
    }

    .app-name {
      font-size: 2.5rem;
      font-weight: 300;
      color: #8b4c6b;
      margin: 0;
      letter-spacing: 0.05em;
      font-family: 'Georgia', serif;
      animation: fadeInText 0.6s ease-in 0.2s backwards;
    }

    .tagline {
      font-size: 1rem;
      color: #a67c96;
      margin-top: 0.5rem;
      font-style: italic;
      animation: fadeInText 0.6s ease-in 0.4s backwards;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes scaleIn {
      from {
        transform: scale(0.9);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-8px);
      }
    }

    @keyframes fadeInText {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .logo-circle {
        width: 100px;
        height: 100px;
      }

      .logo {
        width: 60px;
        height: 60px;
      }

      .app-name {
        font-size: 2rem;
      }

      .tagline {
        font-size: 0.9rem;
      }
    }
  `]
})
export class SplashComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    setTimeout(() => {
      this.router.navigate(['/auth']);
    }, 1800);
  }
}
