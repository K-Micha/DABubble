import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ProfileCard } from '../../profile/profile-card/profile-card';
import { ProfileMenu } from '../../profile/profile-menu/profile-menu';
import { ClickOutsideDirective } from '../../../shared/click-outside/click-outside.directive';
import { FIREBASE_AUTH } from '../../../shared/firebase/firebase.tokens';
import { Icon } from '../../../shared/icon/icon';
import { User } from '../../../shared/models';
import { UserService } from '../../../shared/user/user.service';

export type HeaderVariant = 'auth-login' | 'auth-register' | 'app' | 'mobile';

@Component({
  selector: 'app-header',
  imports: [RouterLink, Icon, ProfileCard, ProfileMenu, ClickOutsideDirective],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  @Input() variant: HeaderVariant = 'app';

  private readonly auth = inject(FIREBASE_AUTH);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  protected readonly currentUid = signal<string | null>(null);
  protected readonly currentUser = signal<User | null>(null);
  protected readonly showProfile = signal(false);
  protected readonly showProfileMenu = signal(false);

  /** Laedt den aktuellen User fuer die App-Variante. */
  ngOnInit(): void {
    if (this.variant === 'app') {
      void this.loadCurrentUser();
    }
  }

  /** Laedt das aktuelle User-Profil. */
  private async loadCurrentUser(): Promise<void> {
    const uid = await this.resolveUid();

    if (!uid) return;

    this.currentUid.set(uid);
    this.currentUser.set(await this.userService.getUser(uid));
  }

  /** Wartet bei Bedarf auf die Firebase-Session. */
  private resolveUid(): Promise<string | null> {
    if (this.auth.currentUser) {
      return Promise.resolve(this.auth.currentUser.uid);
    }

    return this.waitForAuthState();
  }

  /** Wartet auf die erste Firebase-Auth-State-Aenderung. */
  private waitForAuthState(): Promise<string | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        unsubscribe();
        resolve(user?.uid ?? null);
      });
    });
  }

  /** Oeffnet oder schliesst das Profilmenue. */
  protected toggleProfileMenu(): void {
    this.showProfileMenu.update((open) => !open);
  }

  /** Schliesst das Profilmenue (z. B. Klick ausserhalb). */
  protected closeProfileMenu(): void {
    this.showProfileMenu.set(false);
  }

  /** Oeffnet das eigene Profil. */
  protected openProfile(): void {
    this.showProfileMenu.set(false);
    this.showProfile.set(true);
  }

  /** Schliesst die Profilansicht. */
  protected onProfileClosed(): void {
    this.showProfile.set(false);
  }

  /** Meldet den aktuellen User ab. */
  protected async logout(): Promise<void> {
    this.showProfileMenu.set(false);
    await signOut(this.auth);
    this.clearCurrentUser();
    await this.router.navigate(['/login']);
  }

  /** Entfernt die lokalen Daten des aktuellen Users. */
  private clearCurrentUser(): void {
    this.currentUid.set(null);
    this.currentUser.set(null);
    this.showProfile.set(false);
  }
}
