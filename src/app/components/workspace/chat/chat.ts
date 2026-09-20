import { Component, inject, signal } from '@angular/core';
import { onAuthStateChanged } from 'firebase/auth';

import { AddMembers } from '../../channel/add-members/add-members';
import { ChannelService } from '../../../shared/channel/channel.service';
import { FIREBASE_AUTH } from '../../../shared/firebase/firebase.tokens';
import { Channel, Message, User } from '../../../shared/models';

import { Header } from '../header/header';
import { MainChat } from '../main-chat/main-chat';
import { Sidebar } from '../sidebar/sidebar';
import { Thread } from '../thread/thread';

/** Verbindet Header, Sidebar, Main-Chat und Thread im Workspace. */
@Component({
  selector: 'app-chat',
  imports: [Header, Sidebar, MainChat, Thread, AddMembers],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly channelService = inject(ChannelService);

  protected readonly selectedChannel = signal<Channel | null>(null);

  protected readonly selectedUser = signal<User | null>(null);

  protected readonly addMembersOpen = signal(false);

  protected readonly sidebarOpen = signal(true);

  protected readonly activeThreadMessage = signal<Message | null>(null);

  /** Lädt beim Start denselben ersten Channel wie der Main-Chat. */
  constructor() {
    void this.loadInitialChannel();
  }

  /** Setzt den initial geöffneten Channel auch im Workspace. */
  private async loadInitialChannel(): Promise<void> {
    await this.waitForAuth();
    const channels = await this.channelService.listChannels();

    this.selectedChannel.set(channels[0] ?? null);
  }

  /**
   * Wartet direkt nach einem Reload auf die aus IndexedDB wiederhergestellte
   * Firebase-Session, bevor der erste Firestore-Read feuert - sonst ist
   * `request.auth` serverseitig noch `null` und die Regeln blocken den Read
   * (permission-denied).
   */
  private waitForAuth(): Promise<void> {
    if (this.auth.currentUser) return Promise.resolve();

    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, () => {
        unsubscribe();
        resolve();
      });
    });
  }

  /** Übernimmt den ausgewählten Channel. */
  protected onChannelSelected(channel: Channel): void {
    this.selectedUser.set(null);
    this.selectedChannel.set(channel);
    this.activeThreadMessage.set(null);
  }

  /** Übernimmt den ausgewählten Direktchat-User. */
  protected onUserSelected(user: User): void {
    this.selectedChannel.set(null);
    this.selectedUser.set(user);
    this.addMembersOpen.set(false);
    this.activeThreadMessage.set(null);
  }

  /** Öffnet das Thread-Panel für eine ausgewählte Nachricht. */
  protected onReplyClicked(message: Message): void {
    this.activeThreadMessage.set(message);
  }

  /** Schließt das Thread-Panel. */
  protected onThreadClosed(): void {
    this.activeThreadMessage.set(null);
  }

  /** Öffnet oder schließt das Workspace-Menü. */
  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  /** Öffnet Add-Members beim Klick auf den Plus-Button. */
  protected onMainChatClick(event: Event): void {
    const target = event.target as HTMLElement;

    if (!target.closest('[aria-label="Mitglieder hinzufügen"]')) {
      return;
    }

    if (!this.selectedChannel()) return;

    this.addMembersOpen.set(true);
  }

  /** Schließt den Add-Members-Dialog. */
  protected closeAddMembers(): void {
    this.addMembersOpen.set(false);
  }
}
