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
import {
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { FIREBASE_AUTH } from '../../../shared/firebase/firebase.tokens';
import { Icon } from '../../../shared/icon/icon';
import { User } from '../../../shared/models';
import { Spinner } from '../../../shared/spinner/spinner';
import { UserService } from '../../../shared/user/user.service';
import { ProfileEdit } from '../profile-edit/profile-edit';

/** Zeigt das eigene Profil oder das Profil eines anderen Users an. */
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
  readonly closed = output<void>();
  readonly messageClicked = output<string>();

  protected readonly user = signal<User | null>(null);
  protected readonly editMode = signal(false);

  private readonly currentUid = signal<string | null>(null);
  private readonly currentIsGuest = signal(false);

  protected readonly isOwnProfile = computed(
    () => this.currentUid() === this.userId(),
  );

  protected readonly isGuestProfile = computed(
    () => this.currentIsGuest() && this.isOwnProfile(),
  );

  constructor() {
    this.resolveCurrentUser();
    effect(() => void this.loadUser(this.userId()));
  }

  /** Laedt das angeforderte User-Profil aus Firestore. */
  private async loadUser(uid: string): Promise<void> {
    this.user.set(await this.userService.getUser(uid));
  }

  /** Ermittelt den aktuellen Firebase-User und dessen Gaststatus. */
  private resolveCurrentUser(): void {
    const currentUser = this.auth.currentUser;

    if (currentUser) {
      this.setCurrentUser(currentUser);
      return;
    }

    this.waitForCurrentUser();
  }

  /** Wartet nach einem Reload auf die wiederhergestellte Auth-Session. */
  private waitForCurrentUser(): void {
    const unsubscribe = onAuthStateChanged(this.auth, (user) => {
      unsubscribe();
      this.setCurrentUser(user);
    });
  }

  /** Speichert UID und Gaststatus des aktuellen Firebase-Users. */
  private setCurrentUser(user: FirebaseUser | null): void {
    this.currentUid.set(user?.uid ?? null);
    this.currentIsGuest.set(user?.isAnonymous ?? false);
  }

  /** Schliesst das Profil mit Escape ausserhalb des Bearbeitungsmodus. */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.editMode()) return;
    this.closed.emit();
  }

  /** Schliesst das Profil ueber den Backdrop. */
  protected onBackdropClick(): void {
    this.closed.emit();
  }

  /** Schliesst das Profil ueber den Close-Button. */
  protected onClose(): void {
    this.closed.emit();
  }

  /** Oeffnet die Bearbeitung des eigenen Profils. */
  protected onEditClick(): void {
    if (this.isGuestProfile()) return;
    this.editMode.set(true);
  }

  /** Schliesst die Bearbeitung und laedt das Profil neu. */
  protected onEditSaved(): void {
    this.editMode.set(false);
    void this.loadUser(this.userId());
  }

  /** Schliesst die Profilbearbeitung ohne Aenderung. */
  protected onEditClosed(): void {
    this.editMode.set(false);
  }

  /** Meldet den ausgewaehlten User fuer eine Direktnachricht zurueck. */
  protected onMessageClick(): void {
    this.messageClicked.emit(this.userId());
  }
}