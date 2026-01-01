// frontend/src/app/services/token-refresh.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface TokenRefreshResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
}

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService implements OnDestroy {
  private apiUrl = 'http://localhost:8080/api/auth';
  private refreshSubscription?: Subscription;
  private readonly REFRESH_INTERVAL = 2 * 60 * 60 * 1000; // 2 heures en millisecondes
  // Alternative: rafraîchir toutes les heures
  // private readonly REFRESH_INTERVAL = 60 * 60 * 1000; // 1 heure

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Démarre le rafraîchissement automatique du token
   */
  startAutoRefresh(): void {
    // Arrêter tout rafraîchissement en cours
    this.stopAutoRefresh();

    console.log('🔄 Démarrage du rafraîchissement automatique du token');
    console.log(`⏱️ Intervalle: ${this.REFRESH_INTERVAL / 1000 / 60 / 60} heures`);

    // Créer un observable qui émet à intervalles réguliers
    this.refreshSubscription = interval(this.REFRESH_INTERVAL)
      .pipe(
        switchMap(() => {
          console.log('🔄 Tentative de rafraîchissement du token...');
          return this.refreshToken();
        }),
        catchError(error => {
          console.error('❌ Erreur lors du rafraîchissement automatique:', error);
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            console.log('✅ Token rafraîchi automatiquement avec succès');
          }
        },
        error: (error) => {
          console.error('❌ Erreur fatale lors du rafraîchissement:', error);
          this.handleRefreshError();
        }
      });
  }

  /**
   * Arrête le rafraîchissement automatique
   */
  stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      console.log('⏹️ Arrêt du rafraîchissement automatique du token');
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = undefined;
    }
  }

  /**
   * Rafraîchit manuellement le token
   */
  refreshToken() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('⚠️ Aucun token à rafraîchir');
      return of(null);
    }

    return this.http.post<TokenRefreshResponse>(`${this.apiUrl}/refresh-token`, {}).pipe(
      switchMap(response => {
        // Mettre à jour le token et les informations utilisateur
        localStorage.setItem('token', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response));
        
        console.log('✅ Token rafraîchi avec succès');
        console.log('🕐 Prochain rafraîchissement dans', this.REFRESH_INTERVAL / 1000 / 60 / 60, 'heures');
        
        return of(response);
      }),
      catchError(error => {
        console.error('❌ Erreur lors du rafraîchissement du token:', error);
        
        // Si erreur 401, le token est probablement invalide
        if (error.status === 401) {
          this.handleRefreshError();
        }
        
        return of(null);
      })
    );
  }

  /**
   * Gère les erreurs de rafraîchissement
   */
  private handleRefreshError(): void {
    console.warn('⚠️ Impossible de rafraîchir le token - Déconnexion');
    
    // Arrêter le rafraîchissement
    this.stopAutoRefresh();
    
    // Nettoyer le stockage
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    
    // Rediriger vers la page de connexion
    this.router.navigate(['/auth']);
  }

  /**
   * Vérifie si le token est proche de l'expiration
   * et le rafraîchit si nécessaire
   */
  checkAndRefreshIfNeeded(): void {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return;
    }

    try {
      // Décoder le JWT pour obtenir la date d'expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convertir en millisecondes
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      // Si le token expire dans moins d'une heure, le rafraîchir immédiatement
      if (timeUntilExpiration < 60 * 60 * 1000) {
        console.log('⚠️ Token proche de l\'expiration - Rafraîchissement immédiat');
        this.refreshToken().subscribe();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du token:', error);
    }
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }
}