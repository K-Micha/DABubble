import { Component, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';

const INTRO_DURATION_MS = 2400;

/** Splash-Screen: Logo-Animation (Figma "00-Intro"), danach zu /login. Klick überspringt. */
@Component({
  selector: 'app-intro',
  templateUrl: './intro.html',
  styleUrl: './intro.scss',
})
export class Intro {
  private readonly router = inject(Router);

  constructor() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => this.goToLogin(), reduced ? 300 : INTRO_DURATION_MS);
    inject(DestroyRef).onDestroy(() => clearTimeout(timer));
  }

  protected skip(): void {
    this.goToLogin();
  }

  private goToLogin(): void {
    void this.router.navigate(['/login']);
  }
}
