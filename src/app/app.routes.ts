import { Routes } from '@angular/router';

/**
 * Routing-Grundgeruest (Sprint 0). Lazy geladen ueber loadComponent.
 * Auth-Guards und die Workspace-Shell (Header + Sidebar + <router-outlet>)
 * folgen in Sprint 1.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/intro/intro').then((m) => m.Intro),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/auth/forgot-password/forgot-password').then(
        (m) => m.ForgotPassword,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./components/auth/reset-password/reset-password').then(
        (m) => m.ResetPassword,
      ),
  },
  {
    // TODO Sprint 1: durch Workspace-Shell ersetzen (Header + Sidebar + Kind-Routes
    // fuer Chat/Thread/New-Message). Besitzer: Milos (Shell) + Michael (Chat-Layout).
    path: 'workspace',
    loadComponent: () =>
      import('./components/workspace/chat/chat').then((m) => m.Chat),
  },
  {
    path: 'imprint',
    loadComponent: () =>
      import('./pages/imprint/imprint').then((m) => m.Imprint),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./pages/privacy/privacy').then((m) => m.Privacy),
  },
  { path: '**', redirectTo: '' },
];
