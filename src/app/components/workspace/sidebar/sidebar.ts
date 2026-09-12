import { Component, inject, signal } from '@angular/core';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
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

/** Verwaltet Channels, Direktkontakte und Dialoge der Workspace-Sidebar. */
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
  private readonly currentIsGuest = signal(false);

  protected readonly channelsExpanded = signal(true);
  protected readonly dmsExpanded = signal(true);

  protected readonly selectedChannelId = signal<string | null>(null);
  protected readonly selectedUserId = signal<string | null>(null);

  protected readonly activeDialog = signal<SidebarDialog>(null);
  protected readonly dialogChannelId = signal<string | null>(null);
  protected readonly dialogUserId = signal<string | null>(null);

  constructor() {
    void this.loadChannels();
    this.resolveCurrentUser();
  }

  /** Laedt alle vorhandenen Channels fuer die Sidebar. */
  private async loadChannels(): Promise<void> {
    this.channels.set(await this.channelService.listChannels());
  }

  /** Ermittelt den aktuellen Firebase-User und dessen Gaststatus. */
  private resolveCurrentUser(): void {
    const user = this.auth.currentUser;

    if (user) {
      this.setCurrentUser(user);
      return;
    }

    const unsubscribe = onAuthStateChanged(this.auth, (currentUser) => {
      unsubscribe();
      this.setCurrentUser(currentUser);
    });
  }

  /** Speichert UID und Gaststatus und laedt die sichtbaren Kontakte. */
  private setCurrentUser(user: FirebaseUser | null): void {
    this.currentUid.set(user?.uid ?? null);
    this.currentIsGuest.set(user?.isAnonymous ?? false);
    void this.loadUsers();
  }

  /** Laedt nur die fuer den aktuellen Login sichtbaren User. */
  private async loadUsers(): Promise<void> {
    const users = await this.userService.listVisibleUsers(
      this.currentIsGuest(),
    );

    this.users.set(
      users.filter((user) => user.id !== this.currentUid()),
    );
  }

  /** Oeffnet oder schliesst die Channel-Liste. */
  protected toggleChannels(): void {
    this.channelsExpanded.update((open) => !open);
  }

  /** Oeffnet oder schliesst die Direktnachrichten-Liste. */
  protected toggleDms(): void {
    this.dmsExpanded.update((open) => !open);
  }

  /** Waehlt einen Channel und oeffnet dessen Verwaltungsdialog. */
  protected selectChannel(channel: Channel): void {
    this.selectedChannelId.set(channel.id);
    this.selectedUserId.set(null);
    this.dialogChannelId.set(channel.id);
    this.activeDialog.set('channel-info');
  }

  /** Waehlt einen User und oeffnet dessen Profil. */
  protected selectUser(user: User): void {
    this.selectedUserId.set(user.id);
    this.selectedChannelId.set(null);
    this.dialogUserId.set(user.id);
    this.activeDialog.set('profile');
  }

  /** Oeffnet den Dialog zum Erstellen eines Channels. */
  protected onAddChannel(): void {
    this.activeDialog.set('create');
  }

  /** Oeffnet nach der Erstellung die Mitglieder-Auswahl. */
  protected onChannelCreated(channelId: string): void {
    this.dialogChannelId.set(channelId);
    this.activeDialog.set('add-members');
  }

  /** Schliesst den Channel-Erstellen-Dialog. */
  protected onCreateClosed(): void {
    this.activeDialog.set(null);
  }

  /** Schliesst die Mitglieder-Auswahl und aktualisiert Channels. */
  protected onAddMembersClosed(): void {
    this.activeDialog.set(null);
    this.dialogChannelId.set(null);
    void this.loadChannels();
  }

  /** Schliesst die Channel-Info und aktualisiert Channels. */
  protected onChannelInfoClosed(): void {
    this.activeDialog.set(null);
    this.dialogChannelId.set(null);
    void this.loadChannels();
  }

  /** Schliesst das geoeffnete User-Profil. */
  protected onProfileClosed(): void {
    this.activeDialog.set(null);
    this.dialogUserId.set(null);
  }
}