// frontend/src/app/components/dashboard-navbar/dashboard-navbar.component.ts
import { Component, OnInit, signal, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, AuthResponse } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <!-- Logo Section -->
        <div class="logo-section">
          <div class="logo-circle">
            <svg class="flower-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="25" r="12" fill="#E91E63" />
              <circle cx="75" cy="50" r="12" fill="#E91E63" />
              <circle cx="50" cy="75" r="12" fill="#E91E63" />
              <circle cx="25" cy="50" r="12" fill="#E91E63" />
              <circle cx="65" cy="35" r="9" fill="#F06292" />
              <circle cx="65" cy="65" r="9" fill="#F06292" />
              <circle cx="35" cy="65" r="9" fill="#F06292" />
              <circle cx="35" cy="35" r="9" fill="#F06292" />
              <circle cx="50" cy="50" r="15" fill="#4CAF50" />
              <circle cx="50" cy="50" r="10" fill="#81C784" />
            </svg>
          </div>
          <div class="brand-text">
            <h1>Flower & Flower</h1>
            <span class="tagline">Gestion de Production</span>
          </div>
        </div>

        <!-- Navigation Menu -->
        <div class="nav-section">
          <div class="nav-group">
            <span class="group-label">Données</span>
            <div class="nav-items">
              <button
                class="nav-item"
                [class.active]="activeMenu() === 'articles'"
                (click)="setActiveMenu('articles')"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                <span class="nav-text">Articles</span>
              </button>

              <button
                class="nav-item"
                [class.active]="activeMenu() === 'process'"
                (click)="setActiveMenu('process')"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6m0 6v6" />
                </svg>
                <span class="nav-text">Process</span>
              </button>

              <button
                class="nav-item"
                [class.active]="activeMenu() === 'clients'"
                (click)="setActiveMenu('clients')"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                <span class="nav-text">Clients</span>
              </button>
            </div>
          </div>

          <div class="nav-divider"></div>

          <div class="nav-group">
            <span class="group-label">Opérations</span>
            <div class="nav-items">
              <button
                class="nav-item"
                [class.active]="activeMenu() === 'production'"
                (click)="setActiveMenu('production')"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span class="nav-text">Production</span>
              </button>

              <button
                class="nav-item"
                [class.active]="activeMenu() === 'commande'"
                (click)="setActiveMenu('commande')"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                </svg>
                <span class="nav-text">Commandes</span>
              </button>

              <button
                class="nav-item"
                [class.active]="activeMenu() === 'livraison'"
                (click)="setActiveMenu('livraison')"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                </svg>
                <span class="nav-text">Livraison</span>
              </button>
            </div>
          </div>

          <div class="nav-divider"></div>

          <!-- ✅ NOUVELLE SECTION ÉTAT -->
          <div class="nav-group">
            <span class="group-label">Reporting</span>
            <div class="nav-items">
              <div class="dropdown-wrapper">
                <button
                  class="nav-item dropdown-btn"
                  [class.active]="activeMenu() === 'etat-commande' || activeMenu() === 'etat-stock'"
                  (click)="toggleEtatDropdown()"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  <span class="nav-text">État</span>
                  <svg
                    class="dropdown-icon"
                    [class.rotated]="showEtatDropdown()"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                <!-- Dropdown Menu -->
                <div class="dropdown-menu" *ngIf="showEtatDropdown()">
                  <button
                    class="dropdown-item"
                    [class.active]="activeMenu() === 'etat-commande'"
                    (click)="setActiveMenu('etat-commande')"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                    </svg>
                    État de commande
                  </button>
                  <button
                    class="dropdown-item"
                    [class.active]="activeMenu() === 'etat-stock'"
                    (click)="setActiveMenu('etat-stock')"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                    État de stock
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- User Section -->
        <div class="user-section">
          <div class="user-info" *ngIf="currentUser">
            <div class="user-details">
              <span class="user-name">{{ currentUser.firstname }} {{ currentUser.lastname }}</span>
              <span class="user-email">{{ currentUser.email }}</span>
            </div>
          </div>

          <div class="user-actions">
            <button class="action-btn profile-btn" (click)="openProfile()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Profil</span>
            </button>

            <button class="action-btn logout-btn" (click)="logout()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Quitter</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [
    `
      .navbar {
        background: white;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        position: sticky;
        top: 0;
        z-index: 100;
        border-bottom: 3px solid #E91E63;
      }

      .navbar-container {
        display: flex;
        align-items: center;
        padding: 1.25rem 2rem;
        gap: 2rem;
        max-width: 1920px;
        margin: 0 auto;
      }

      /* Logo Section */
      .logo-section {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-shrink: 0;
      }

      .logo-circle {
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #fff0f5, #ffe4ec);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(233, 30, 99, 0.2);
        flex-shrink: 0;
      }

      .flower-icon {
        width: 32px;
        height: 32px;
      }

      .brand-text {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }

      .brand-text h1 {
        font-size: 1.3rem;
        color: #c2185b;
        font-family: 'Georgia', serif;
        margin: 0;
        font-weight: 500;
        line-height: 1.2;
      }

      .tagline {
        font-size: 0.75rem;
        color: #999;
        font-weight: 400;
      }

      /* Navigation Section */
      .nav-section {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1.5rem;
        flex: 1;
      }

      .nav-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .group-label {
        font-size: 0.7rem;
        font-weight: 600;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 0 0.75rem;
      }

      .nav-items {
        display: flex;
        gap: 0.5rem;
      }

      .nav-divider {
        width: 2px;
        height: 60px;
        background: linear-gradient(to bottom, transparent, #e0e0e0, transparent);
      }

      .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
        padding: 0.75rem 1rem;
        background: transparent;
        border: 2px solid transparent;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
      }

      .nav-item svg {
        stroke-width: 2;
        color: #666;
        transition: all 0.3s ease;
      }

      .nav-text {
        font-size: 0.8rem;
        font-weight: 600;
        color: #666;
        transition: all 0.3s ease;
      }

      .nav-item:hover {
        background: #fff0f5;
        border-color: #ffe4ec;
        transform: translateY(-2px);
      }

      .nav-item:hover svg,
      .nav-item:hover .nav-text {
        color: #c2185b;
      }

      .nav-item.active {
        background: linear-gradient(135deg, #e91e63, #f06292);
        border-color: #e91e63;
        box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
      }

      .nav-item.active svg,
      .nav-item.active .nav-text {
        color: white;
      }

      /* ✅ STYLES DROPDOWN */
      .dropdown-wrapper {
        position: relative;
      }

      .dropdown-btn {
        padding: 0.75rem 0.85rem !important;
        flex-direction: row !important;
        gap: 0.5rem !important;
        min-width: 110px;
      }

      .dropdown-btn .nav-text {
        font-size: 0.8rem;
      }

      .dropdown-icon {
        transition: transform 0.3s ease;
        margin-left: 0.25rem;
      }

      .dropdown-icon.rotated {
        transform: rotate(180deg);
      }

      .dropdown-menu {
        position: absolute;
        top: calc(100% + 0.5rem);
        left: 0;
        background: white;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        padding: 0.5rem;
        min-width: 200px;
        z-index: 1000;
        animation: slideDown 0.3s ease;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 1rem;
        background: transparent;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.85rem;
        font-weight: 500;
        color: #666;
        text-align: left;
      }

      .dropdown-item svg {
        flex-shrink: 0;
        color: #666;
        transition: color 0.3s ease;
      }

      .dropdown-item:hover {
        background: #fff0f5;
        color: #c2185b;
      }

      .dropdown-item:hover svg {
        color: #c2185b;
      }

      .dropdown-item.active {
        background: linear-gradient(135deg, #e91e63, #f06292);
        color: white;
      }

      .dropdown-item.active svg {
        color: white;
      }

      /* User Section */
      .user-section {
        display: flex;
        align-items: center;
        gap: 1rem;
        justify-content: flex-end;
        flex-shrink: 0;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding-right: 1rem;
        border-right: 2px solid #f0f0f0;
      }

      .user-details {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }

      .user-name {
        font-weight: 600;
        color: #333;
        font-size: 0.9rem;
      }

      .user-email {
        font-size: 0.75rem;
        color: #999;
      }

      .user-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.65rem 1.1rem;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
        transition: all 0.3s ease;
        white-space: nowrap;
      }

      .profile-btn {
        background: linear-gradient(135deg, #9c27b0, #ba68c8);
        color: white;
      }

      .profile-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(156, 39, 176, 0.4);
      }

      .logout-btn {
        background: linear-gradient(135deg, #e91e63, #f06292);
        color: white;
      }

      .logout-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(233, 30, 99, 0.4);
      }

      /* Responsive Design */
      @media (max-width: 1600px) {
        .nav-item {
          padding: 0.65rem 0.85rem;
        }

        .nav-text {
          font-size: 0.75rem;
        }
      }

      @media (max-width: 1400px) {
        .navbar-container {
          gap: 1.5rem;
        }

        .group-label {
          display: none;
        }

        .nav-group {
          gap: 0;
        }
      }

      @media (max-width: 1200px) {
        .navbar-container {
          flex-wrap: wrap;
          gap: 1rem;
        }

        .logo-section {
          justify-content: center;
        }

        .nav-section {
          flex-wrap: wrap;
          gap: 1rem;
          width: 100%;
          justify-content: center;
        }

        .nav-divider {
          display: none;
        }

        .user-section {
          justify-content: center;
          width: 100%;
        }

        .user-info {
          border-right: none;
          padding-right: 0;
        }
      }

      @media (max-width: 768px) {
        .navbar-container {
          padding: 1rem;
        }

        .brand-text h1 {
          font-size: 1.1rem;
        }

        .tagline {
          display: none;
        }

        .nav-items {
          flex-wrap: wrap;
          justify-content: center;
        }

        .user-info {
          display: none;
        }

        .action-btn span {
          display: none;
        }

        .action-btn {
          padding: 0.7rem;
          min-width: 42px;
          justify-content: center;
        }
      }
    `,
  ],
})
export class DashboardNavbarComponent implements OnInit {
  activeMenu = signal<'articles' | 'process' | 'clients' | 'production' | 'commande' | 'livraison' | 'etat-commande' | 'etat-stock'>(
    'articles'
  );
  showEtatDropdown = signal(false);
  currentUser: AuthResponse | null = null;

  @Output() profileClick = new EventEmitter<void>();
  @Output() menuChange = new EventEmitter<
    'articles' | 'process' | 'clients' | 'production' | 'commande' | 'livraison' | 'etat-commande' | 'etat-stock'
  >();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });
    // ✅ Restaurer le menu actif depuis localStorage
    const savedMenu = localStorage.getItem('activeMenu');
    if (savedMenu) {
      const menu = savedMenu as 'articles' | 'process' | 'clients' | 'production' | 'commande' | 'livraison' | 'etat-commande' | 'etat-stock';
      this.activeMenu.set(menu);
      this.menuChange.emit(menu);
    }
  }

   setActiveMenu(
    menu: 'articles' | 'process' | 'clients' | 'production' | 'commande' | 'livraison' | 'etat-commande' | 'etat-stock'
  ) {
    this.activeMenu.set(menu);
    this.menuChange.emit(menu);

    // ✅ Sauvegarder le menu actif dans localStorage
    localStorage.setItem('activeMenu', menu);

    // Fermer le dropdown après sélection
    if (menu === 'etat-commande' || menu === 'etat-stock') {
      this.showEtatDropdown.set(false);
    }
  }

  toggleEtatDropdown() {
    this.showEtatDropdown.update(v => !v);
  }

  openProfile() {
    this.profileClick.emit();
  }

  logout() {
    this.authService.logout();
  }
}
