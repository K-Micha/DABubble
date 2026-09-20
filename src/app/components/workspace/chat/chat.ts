import {
  Component,
  inject,
  signal,
} from '@angular/core';

import { AddMembers } from '../../channel/add-members/add-members';
import { ChannelService } from '../../../shared/channel/channel.service';
import {
  Channel,
  User,
} from '../../../shared/models';

import { Header } from '../header/header';
import { MainChat } from '../main-chat/main-chat';
import { Sidebar } from '../sidebar/sidebar';
import { Thread } from '../thread/thread';

/** Verbindet Header, Sidebar, Main-Chat und Thread im Workspace. */
@Component({
  selector: 'app-chat',
  imports: [
    Header,
    Sidebar,
    MainChat,
    Thread,
    AddMembers,
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  private readonly channelService = inject(ChannelService);

  protected readonly selectedChannel =
    signal<Channel | null>(null);

  protected readonly selectedUser =
    signal<User | null>(null);

  protected readonly addMembersOpen =
    signal(false);

  /** Lädt beim Start denselben ersten Channel wie der Main-Chat. */
  constructor() {
    void this.loadInitialChannel();
  }

  /** Setzt den initial geöffneten Channel auch im Workspace. */
  private async loadInitialChannel(): Promise<void> {
    const channels = await this.channelService.listChannels();

    this.selectedChannel.set(
      channels[0] ?? null,
    );
  }

  /** Übernimmt den ausgewählten Channel. */
  protected onChannelSelected(channel: Channel): void {
    this.selectedUser.set(null);
    this.selectedChannel.set(channel);
  }

  /** Übernimmt den ausgewählten Direktchat-User. */
  protected onUserSelected(user: User): void {
    this.selectedChannel.set(null);
    this.selectedUser.set(user);
    this.addMembersOpen.set(false);
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