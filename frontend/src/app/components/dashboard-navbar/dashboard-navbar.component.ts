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
      <div class="navbar-left">
        <div class="logo-section">
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
          <h1>Flower & Flower</h1>
        </div>

        <div class="nav-menu">
          <button
            class="nav-item"
            [class.active]="activeMenu() === 'articles'"
            (click)="setActiveMenu('articles')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
              />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Fiche d'article
          </button>

          <button
            class="nav-item"
            [class.active]="activeMenu() === 'process'"
            (click)="setActiveMenu('process')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m-6-6H0m6 0h6m-6 0a6 6 0 1 0 12 0 6 6 0 1 0-12 0" />
            </svg>
            Process
          </button>

          <button
            class="nav-item"
            [class.active]="activeMenu() === 'clients'"
            (click)="setActiveMenu('clients')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Clients
          </button>

          <button
            class="nav-item"
            [class.active]="activeMenu() === 'production'"
            (click)="setActiveMenu('production')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Production
          </button>

          <button
            class="nav-item"
            [class.active]="activeMenu() === 'commande'"
            (click)="setActiveMenu('commande')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Commandes
          </button>

          <button
            class="nav-item"
            [class.active]="activeMenu() === 'livraison'"
            (click)="setActiveMenu('livraison')"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            Livraison
          </button>
        </div>
      </div>

      <div class="navbar-right">
        <div class="user-info" *ngIf="currentUser">
          <span class="user-name">{{ currentUser.firstname }} {{ currentUser.lastname }}</span>
          <span class="user-email">{{ currentUser.email }}</span>
        </div>

        <button class="profile-btn" (click)="openProfile()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profil
        </button>

        <button class="logout-btn" (click)="logout()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Déconnexion
        </button>
      </div>
    </nav>
  `,
  styles: [
    `
      .navbar {
        background: white;
        padding: 1rem 2rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .navbar-left {
        display: flex;
        align-items: center;
        gap: 3rem;
      }

      .logo-section {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .flower-icon {
        width: 40px;
        height: 40px;
      }

      .logo-section h1 {
        font-size: 1.5rem;
        color: #c2185b;
        font-family: 'Georgia', serif;
        margin: 0;
      }

      .nav-menu {
        display: flex;
        gap: 0.5rem;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        background: transparent;
        border: none;
        border-radius: 8px;
        color: #666;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .nav-item:hover {
        background: #fff5f7;
        color: #c2185b;
      }

      .nav-item.active {
        background: linear-gradient(135deg, #e91e63, #f06292);
        color: white;
      }

      .nav-item svg {
        stroke-width: 2;
      }

      .navbar-right {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        margin-right: 0.5rem;
      }

      .user-name {
        font-weight: 600;
        color: #c2185b;
        font-size: 0.9rem;
      }

      .user-email {
        font-size: 0.8rem;
        color: #999;
      }

      .profile-btn,
      .logout-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 1.1rem;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;
      }

      .profile-btn {
        background: linear-gradient(135deg, #9c27b0, #ba68c8);
      }

      .profile-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
      }

      .logout-btn {
        background: linear-gradient(135deg, #e91e63, #f06292);
      }

      .logout-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
      }

      @media (max-width: 1024px) {
        .navbar {
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        }

        .navbar-left {
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }

        .nav-menu {
          width: 100%;
          justify-content: center;
          flex-wrap: wrap;
        }

        .navbar-right {
          width: 100%;
          justify-content: center;
          flex-wrap: wrap;
        }

        .user-info {
          align-items: center;
        }
      }
    `,
  ],
})
export class DashboardNavbarComponent implements OnInit {
  activeMenu = signal<'articles' | 'process' | 'clients' | 'production' | 'commande' | 'livraison'>(
    'articles'
  );
  currentUser: AuthResponse | null = null;

  @Output() profileClick = new EventEmitter<void>();
  @Output() menuChange = new EventEmitter<
    'articles' | 'process' | 'clients' | 'production' | 'commande' | 'livraison'
  >();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });
  }

  setActiveMenu(
    menu: 'articles' | 'process' | 'clients' | 'production' | 'commande' | 'livraison'
  ) {
    this.activeMenu.set(menu);
    this.menuChange.emit(menu);
  }

  openProfile() {
    this.profileClick.emit();
  }

  logout() {
    this.authService.logout();
  }
}
