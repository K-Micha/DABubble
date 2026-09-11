import { Component, inject, signal } from '@angular/core';
import { onAuthStateChanged } from 'firebase/auth';
import { ChannelAddMembers } from '../../channel/channel-add-members/channel-add-members';
import { ChannelCreate } from '../../channel/channel-create/channel-create';
import { ChannelInfo } from '../../channel/channel-info/channel-info';
import { ProfileCard } from '../../profile/profile-card/profile-card';
import { ChannelService } from '../../../shared/channel/channel.service';
import { FIREBASE_AUTH } from '../../../shared/firebase/firebase.tokens';
import { Icon } from '../../../shared/icon/icon';
import { Channel, User } from '../../../shared/models';
import { UserService } from '../../../shared/user/user.service';

type SidebarDialog = 'create' | 'add-members' | 'channel-info' | 'profile' | null;

/**
 * Grobes Workspace-Sidebar-Grundgeruest (Spalte 1). Channel erstellen,
 * Channel-Info und Profil-Card sind echt verdrahtet (Komponenten existieren
 * ja schon). Die eigentliche Chat-Ansicht/-Auswahl ist Michaels Teil und
 * kommt spaeter dazu.
 */
@Component({
  selector: 'app-sidebar',
  imports: [Icon, ChannelCreate, ChannelAddMembers, ChannelInfo, ProfileCard],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly channelService = inject(ChannelService);
  private readonly userService = inject(UserService);

  protected readonly channels = signal<Channel[]>([]);
  protected readonly users = signal<User[]>([]);
  private readonly currentUid = signal<string | null>(null);

  protected readonly channelsExpanded = signal(true);
  protected readonly dmsExpanded = signal(true);

  protected readonly selectedChannelId = signal<string | null>(null);
  protected readonly selectedUserId = signal<string | null>(null);

  protected readonly activeDialog = signal<SidebarDialog>(null);
  protected readonly dialogChannelId = signal<string | null>(null);
  protected readonly dialogUserId = signal<string | null>(null);

  constructor() {
    void this.loadChannels();
    this.resolveCurrentUid();
  }

  private async loadChannels(): Promise<void> {
    this.channels.set(await this.channelService.listChannels());
  }

  private resolveCurrentUid(): void {
    if (this.auth.currentUser) {
      this.currentUid.set(this.auth.currentUser.uid);
      void this.loadUsers();
      return;
    }
    const unsubscribe = onAuthStateChanged(this.auth, (user) => {
      unsubscribe();
      this.currentUid.set(user?.uid ?? null);
      void this.loadUsers();
    });
  }

  private async loadUsers(): Promise<void> {
    const all = await this.userService.listUsers();
    this.users.set(all.filter((user) => user.id !== this.currentUid()));
  }

  protected toggleChannels(): void {
    this.channelsExpanded.update((open) => !open);
  }

  protected toggleDms(): void {
    this.dmsExpanded.update((open) => !open);
  }

  // TODO: sobald die echte Chat-Ansicht steht (Michaels Teil), hier
  // zusaetzlich den ausgewaehlten Channel an main-chat weiterreichen. Bis
  // dahin oeffnet ein Klick den Verwaltungs-Dialog (channel-info).
  protected selectChannel(channel: Channel): void {
    this.selectedChannelId.set(channel.id);
    this.selectedUserId.set(null);
    this.dialogChannelId.set(channel.id);
    this.activeDialog.set('channel-info');
  }

  // TODO: sobald ein echtes DM-Modul existiert (Michaels Teil), hier
  // zusaetzlich die DM oeffnen. Bis dahin zeigt ein Klick das Profil.
  protected selectUser(user: User): void {
    this.selectedUserId.set(user.id);
    this.selectedChannelId.set(null);
    this.dialogUserId.set(user.id);
    this.activeDialog.set('profile');
  }

  protected onAddChannel(): void {
    this.activeDialog.set('create');
  }

  protected onChannelCreated(channelId: string): void {
    this.dialogChannelId.set(channelId);
    this.activeDialog.set('add-members');
  }

  protected onCreateClosed(): void {
    this.activeDialog.set(null);
  }

  protected onAddMembersClosed(): void {
    this.activeDialog.set(null);
    this.dialogChannelId.set(null);
    void this.loadChannels();
  }

  protected onChannelInfoClosed(): void {
    this.activeDialog.set(null);
    this.dialogChannelId.set(null);
    void this.loadChannels();
  }

  protected onProfileClosed(): void {
    this.activeDialog.set(null);
    this.dialogUserId.set(null);
  }
}
