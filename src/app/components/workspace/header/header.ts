import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { onAuthStateChanged } from 'firebase/auth';
import { ProfileCard } from '../../profile/profile-card/profile-card';
import { FIREBASE_AUTH } from '../../../shared/firebase/firebase.tokens';
import { Icon } from '../../../shared/icon/icon';
import { User } from '../../../shared/models';
import { UserService } from '../../../shared/user/user.service';

export type HeaderVariant = 'auth-login' | 'auth-register' | 'app' | 'mobile';

@Component({
  selector: 'app-header',
  imports: [RouterLink, Icon, ProfileCard],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  @Input() variant: HeaderVariant = 'app';

  private readonly auth = inject(FIREBASE_AUTH);
  private readonly userService = inject(UserService);

  protected readonly currentUid = signal<string | null>(null);
  protected readonly currentUser = signal<User | null>(null);
  protected readonly showProfile = signal(false);

  ngOnInit(): void {
    if (this.variant === 'app') void this.loadCurrentUser();
  }

  private async loadCurrentUser(): Promise<void> {
    const uid = await this.resolveUid();
    if (!uid) return;

    this.currentUid.set(uid);
    this.currentUser.set(await this.userService.getUser(uid));
  }

  /**
   * Direkt nach einem Reload hat Firebase die Session evtl. noch nicht aus
   * IndexedDB restauriert - auf die erste Auth-State-Emission warten statt
   * sofort mit `null` zu vergleichen. Gleiches Pattern wie profile-card.
   */
  private resolveUid(): Promise<string | null> {
    if (this.auth.currentUser) return Promise.resolve(this.auth.currentUser.uid);

    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        unsubscribe();
        resolve(user?.uid ?? null);
      });
    });
  }

  // TODO: sobald die Sidebar/Chat-Auswahl steht, koennte ein Klick auf den
  // Avatar wahlweise auch fremde Profile oeffnen - aktuell immer das eigene.
  protected onAvatarClick(): void {
    this.showProfile.set(true);
  }

  protected onProfileClosed(): void {
    this.showProfile.set(false);
  }
}
