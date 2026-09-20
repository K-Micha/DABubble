import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { ChannelService } from '../../../shared/channel/channel.service';
import { FIREBASE_AUTH } from '../../../shared/firebase/firebase.tokens';
import { Icon } from '../../../shared/icon/icon';
import { User } from '../../../shared/models';
import { UserService } from '../../../shared/user/user.service';

/**
 * Dialog zum Hinzufügen eines Users zu einem bestehenden Channel.
 *
 * Lädt verfügbare User, filtert nach Namen und ergänzt den
 * ausgewählten User in der Mitgliederliste des aktiven Channels.
 */
@Component({
  selector: 'app-add-members',
  imports: [Icon],
  templateUrl: './add-members.html',
  styleUrl: './add-members.scss',
})
export class AddMembers {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly userService = inject(UserService);
  private readonly channelService = inject(ChannelService);

  /** ID des aktuell geöffneten Channels. */
  readonly channelId = input.required<string>();

  /** Meldet dem Parent, dass der Dialog geschlossen werden soll. */
  readonly closed = output<void>();

  protected readonly users = signal<User[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly selectedUser = signal<User | null>(null);
  protected readonly inputFocused = signal(false);
  protected readonly loading = signal(false);

  /** Liefert die zur Suche passenden User. */
  protected readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term || this.selectedUser()) return [];

    return this.users()
      .filter((user) =>
        user.name.toLowerCase().includes(term),
      )
      .slice(0, 5);
  });

  /** Lädt beim Erstellen der Komponente die User-Liste. */
  constructor() {
    void this.loadUsers();
  }

  /** Lädt alle verfügbaren User aus Firestore. */
  private async loadUsers(): Promise<void> {
    this.users.set(
      await this.userService.listUsers(),
    );
  }

  /** Übernimmt den aktuellen Wert des Suchfeldes. */
  protected updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  /** Wählt einen User aus. */
  protected selectUser(user: User): void {
    this.selectedUser.set(user);
    this.searchTerm.set('');
    this.inputFocused.set(false);
  }

  /** Entfernt den aktuell ausgewählten User. */
  protected removeUser(): void {
    this.selectedUser.set(null);
    this.searchTerm.set('');
  }

  /** Markiert das Suchfeld als fokussiert. */
  protected onFocus(): void {
    this.inputFocused.set(true);
  }

  /** Schließt den Dialog über den Close-Button. */
  protected onClose(): void {
    this.closed.emit();
  }

  /** Schließt den Dialog über den Backdrop. */
  protected onBackdropClick(): void {
    this.closed.emit();
  }

  /** Startet das Hinzufügen des ausgewählten Users. */
  protected onSubmit(): void {
    if (!this.selectedUser() || this.loading()) return;

    void this.addMember();
  }

  /** Ergänzt den ausgewählten User im aktiven Channel. */
  private async addMember(): Promise<void> {
    const user = this.selectedUser();

    if (!user) return;

    this.loading.set(true);

    try {
      await this.saveMember(user.id);
      this.closed.emit();
    } catch (error) {
      console.error('[add-members] save failed', error);
    } finally {
      this.loading.set(false);
    }
  }

  /** Lädt den aktiven Channel und aktualisiert seine Mitgliederliste. */
  private async saveMember(userId: string): Promise<void> {
    const channelId = this.channelId();
    const channel = await this.channelService.getChannel(channelId);

    if (!channel) return;

    this.logSaveContext(channelId, channel.createdBy);

    const currentIds = Array.isArray(channel.memberIds)
      ? channel.memberIds
      : [];

    await this.channelService.setMembers(
      channelId,
      [...new Set([...currentIds, userId])],
    );
  }

  /** Zeigt die für die Firestore-Regeln relevanten IDs. */
  private logSaveContext(
    channelId: string,
    createdBy: string,
  ): void {
    console.log('[add-members] channelId:', channelId);
    console.log('[add-members] auth uid:', this.auth.currentUser?.uid);
    console.log('[add-members] createdBy:', createdBy);
  }
}