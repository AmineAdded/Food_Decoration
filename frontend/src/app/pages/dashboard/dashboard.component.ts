import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, AuthResponse } from '../../services/auth.service';
import { UserService, UpdateProfileRequest, ChangePasswordRequest } from '../../services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: AuthResponse | null = null;
  showProfileModal = signal(false);
  activeTab = signal<'info' | 'password'>('info');
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  showPassword = signal(false);
  showNewPassword = signal(false);

  profileData = {
    firstname: '',
    lastname: '',
    email: '',
    phone: ''
  };

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.profileData = {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone
        };
      }
    });
  }

  openProfileModal() {
    if (this.currentUser) {
      this.profileData = {
        firstname: this.currentUser.firstname,
        lastname: this.currentUser.lastname,
        email: this.currentUser.email,
        phone: this.currentUser.phone
      };
    }
    this.errorMessage.set('');
    this.successMessage.set('');
    this.showProfileModal.set(true);
  }

  closeProfileModal() {
    this.showProfileModal.set(false);
    this.activeTab.set('info');
    this.errorMessage.set('');
    this.successMessage.set('');
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  handleUpdateProfile() {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.isLoading.set(true);

    const updateRequest: UpdateProfileRequest = {
      firstname: this.profileData.firstname,
      lastname: this.profileData.lastname,
      email: this.profileData.email,
      phone: this.profileData.phone
    };

    this.userService.updateProfile(updateRequest).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set('Profil mis à jour avec succès!');

        // Mettre à jour le localStorage et le currentUser
        localStorage.setItem('currentUser', JSON.stringify(response));
        localStorage.setItem('token', response.token);
        this.currentUser = response;

        setTimeout(() => {
          this.closeProfileModal();
        }, 2000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Erreur lors de la mise à jour');
      }
    });
  }

  handleChangePassword() {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.errorMessage.set('Les mots de passe ne correspondent pas');
      return;
    }

    if (this.passwordData.newPassword.length < 6) {
      this.errorMessage.set('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    this.isLoading.set(true);

    const changePasswordRequest: ChangePasswordRequest = {
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    };

    this.userService.changePassword(changePasswordRequest).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set(response.message);
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };

        setTimeout(() => {
          this.closeProfileModal();
        }, 2000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Erreur lors du changement de mot de passe');
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
