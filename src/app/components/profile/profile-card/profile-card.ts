import {
  Component,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_AUTH } from '../../../shared/firebase/firebase.tokens';
import { Icon } from '../../../shared/icon/icon';
import { User } from '../../../shared/models';
import { Spinner } from '../../../shared/spinner/spinner';
import { UserService } from '../../../shared/user/user.service';
import { ProfileEdit } from '../profile-edit/profile-edit';

/**
 * Read-only Profil-Ansicht fuer eine beliebige userId. Zeigt bei sich selbst
 * "Bearbeiten" (oeffnet profile-edit inline), bei anderen Usern "Nachricht".
 * Kein eigener Route-Pfad, gleiches Output-Pattern wie channel-create.
 */
@Component({
  selector: 'app-profile-card',
  imports: [Icon, Spinner, ProfileEdit],
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.scss',
})
export class ProfileCard {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly userService = inject(UserService);

  readonly userId = input.required<string>();

  /** Karte wurde geschlossen (X, Escape, Backdrop-Klick). */
  readonly closed = output<void>();
  /** "Nachricht" bei einem fremden Profil geklickt; traegt dessen userId. */
  readonly messageClicked = output<string>();

  protected readonly user = signal<User | null>(null);
  protected readonly editMode = signal(false);

  private readonly currentUid = signal<string | null>(null);
  protected readonly isOwnProfile = computed(
    () => this.currentUid() !== null && this.currentUid() === this.userId(),
  );

  constructor() {
    void this.resolveCurrentUid();
    effect(() => void this.loadUser(this.userId()));
  }

  private async loadUser(uid: string): Promise<void> {
    this.user.set(await this.userService.getUser(uid));
  }

  /**
   * Direkt nach einem Reload hat Firebase die Session evtl. noch nicht aus
   * IndexedDB restauriert - auf die erste Auth-State-Emission warten statt
   * sofort mit `null` zu vergleichen. Gleiches Pattern wie profile-edit.
   */
  private resolveCurrentUid(): void {
    if (this.auth.currentUser) {
      this.currentUid.set(this.auth.currentUser.uid);
      return;
    }
    const unsubscribe = onAuthStateChanged(this.auth, (user) => {
      unsubscribe();
      this.currentUid.set(user?.uid ?? null);
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.editMode()) return; // profile-edit hat waehrenddessen sein eigenes Escape-Handling
    this.closed.emit();
  }

  protected onBackdropClick(): void {
    this.closed.emit();
  }

  protected onClose(): void {
    this.closed.emit();
  }

  protected onEditClick(): void {
    this.editMode.set(true);
  }

  protected onEditSaved(): void {
    this.editMode.set(false);
    void this.loadUser(this.userId());
  }

  protected onEditClosed(): void {
    this.editMode.set(false);
  }

  protected onMessageClick(): void {
    // TODO: sobald Chat/DM-Modul existiert, hier zur DM-Ansicht navigieren
    this.messageClicked.emit(this.userId());
  }
}
