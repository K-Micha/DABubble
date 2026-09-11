import { Component, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { ChannelService } from '../../../shared/channel/channel.service';
import { FIREBASE_AUTH } from '../../../shared/firebase/firebase.tokens';
import { Icon } from '../../../shared/icon/icon';
import { User } from '../../../shared/models';
import { Spinner } from '../../../shared/spinner/spinner';
import { UserService } from '../../../shared/user/user.service';

type MemberMode = 'all' | 'specific';

/**
 * Folgeschritt nach channel-create: fuegt dem uebergebenen Channel Mitglieder
 * hinzu. Kein eigener Route-Pfad, wird vom Parent per channelId geoeffnet
 * (spaeter Michaels Sidebar, s. channel-create).
 */
@Component({
  selector: 'app-channel-add-members',
  imports: [Icon, Spinner],
  templateUrl: './channel-add-members.html',
  styleUrl: './channel-add-members.scss',
})
export class ChannelAddMembers {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly channelService = inject(ChannelService);
  private readonly userService = inject(UserService);

  readonly channelId = input.required<string>();

  /** Mitglieder erfolgreich gespeichert; Dialog schliessen. */
  readonly closed = output<void>();

  protected readonly users = signal<User[]>([]);
  protected readonly mode = signal<MemberMode>('all');
  protected readonly selectedUserIds = signal<ReadonlySet<string>>(new Set());
  protected readonly loading = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly formInvalid = computed(
    () => this.mode() === 'specific' && this.selectedUserIds().size === 0,
  );

  constructor() {
    void this.loadUsers();
  }

  private async loadUsers(): Promise<void> {
    this.users.set(await this.userService.listUsers());
  }

  protected selectMode(mode: MemberMode): void {
    this.mode.set(mode);
  }

  protected isSelected(userId: string): boolean {
    return this.selectedUserIds().has(userId);
  }

  protected toggleUser(userId: string): void {
    const next = new Set(this.selectedUserIds());
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    this.selectedUserIds.set(next);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closed.emit();
  }

  protected onBackdropClick(): void {
    this.closed.emit();
  }

  protected onClose(): void {
    this.closed.emit();
  }

  protected onSubmit(): void {
    if (this.loading() || this.formInvalid()) return;
    void this.runSave();
  }

  private async runSave(): Promise<void> {
    this.loading.set(true);
    this.formError.set(null);

    try {
      await this.channelService.setMembers(this.channelId(), this.buildMemberIds());
      this.closed.emit();
    } catch {
      this.formError.set('Mitglieder konnten nicht gespeichert werden. Bitte versuche es erneut.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Der Channel-Ersteller ist immer dabei, egal welche Option gewaehlt wurde. */
  private buildMemberIds(): string[] {
    const currentUid = this.auth.currentUser?.uid ?? '';
    const chosen =
      this.mode() === 'all' ? this.users().map((user) => user.id) : [...this.selectedUserIds()];

    return [...new Set([currentUid, ...chosen])];
  }
}
