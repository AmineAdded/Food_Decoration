import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AuthResponse, MessageResponse } from './auth.service';

export interface UpdateProfileRequest {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/user';

  constructor(private http: HttpClient) {}

  updateProfile(profileData: UpdateProfileRequest): Observable<AuthResponse> {
    console.log('Sending profile update request:', profileData);

    return this.http.put<AuthResponse>(`${this.apiUrl}/profile`, profileData).pipe(
      tap(response => {
        console.log('Profile update response:', response);
      }),
      catchError(this.handleError)
    );
  }

  changePassword(passwordData: ChangePasswordRequest): Observable<MessageResponse> {
    console.log('Sending password change request');

    return this.http.put<MessageResponse>(`${this.apiUrl}/change-password`, passwordData).pipe(
      tap(response => {
        console.log('Password change response:', response);
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('HTTP Error:', error);

    let errorMessage = 'Une erreur inattendue s\'est produite';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      } else if (error.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (error.status === 403) {
        errorMessage = 'Accès refusé.';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      }
    }

    return throwError(() => ({ error: { message: errorMessage } }));
  }
}
