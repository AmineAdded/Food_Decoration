import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Client
  },
  {
    path: 'splash',
    renderMode: RenderMode.Client
  },
  {
    path: 'auth',
    renderMode: RenderMode.Client
  },
  {
    path: 'forgot-password',
    renderMode: RenderMode.Client
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];