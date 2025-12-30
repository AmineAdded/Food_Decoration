import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Récupérer le token depuis localStorage
  const token = localStorage.getItem('token');

  // Si un token existe, l'ajouter aux headers
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Request with token:', {
      url: req.url,
      method: req.method,
      hasToken: !!token
    });

    return next(clonedRequest);
  }

  // Si pas de token, continuer avec la requête originale
  return next(req);
};
