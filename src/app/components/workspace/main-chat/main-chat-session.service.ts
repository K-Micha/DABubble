import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { onAuthStateChanged } from 'firebase/auth';
import { Unsubscribe } from 'firebase/firestore';
import { ChannelService } from '../../../shared/channel/channel.service';
import { FIREBASE_AUTH } from '../../../shared/firebase/firebase.tokens';
import { MessageService } from '../../../shared/message/message';
import { Channel, Message, User } from '../../../shared/models';
import { MainChatProfileService } from './main-chat-profile.service';

/** Verwaltet den aktiven Channel oder Direktchat. */
@Injectable()
export class MainChatSessionService implements OnDestroy {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly channelService = inject(ChannelService);
  private readonly messageService = inject(MessageService);
  private readonly profileService = inject(MainChatProfileService);

  private unsubscribeMessages: Unsubscribe | null = null;

  readonly channelName = signal('');
  readonly messages = signal<Message[]>([]);
  readonly directUser = signal<User | null>(null);
  readonly channelId = signal<string | null>(null);
  readonly dmId = signal<string | null>(null);

  /** Beendet beim Zerstoeren den aktiven Listener. */
  ngOnDestroy(): void {
    this.stopMessageListener();
  }

  /** Prueft, ob bereits ein Chat ausgewaehlt ist. */
  hasActiveChat(): boolean {
    return !!this.channelId() || !!this.dmId();
  }

  /** Wechselt auf einen Channel. */
  switchChannel(channel: Channel): boolean {
    if (this.isCurrentChannel(channel.id)) return false;

    this.prepareChatSwitch();
    this.channelId.set(channel.id);
    this.channelName.set(channel.name);
    this.subscribeChannelMessages();

    return true;
  }

  /** Prueft, ob der Channel bereits aktiv ist. */
  private isCurrentChannel(channelId: string): boolean {
    return this.channelId() === channelId && !this.dmId();
  }

  /** Wechselt auf einen Direktchat. */
  async switchDirectChat(user: User): Promise<boolean> {
    const currentUid = this.auth.currentUser?.uid;
    if (!currentUid) return false;

    this.prepareChatSwitch();
    this.directUser.set(user);
    this.channelName.set(user.name);
    await this.createDirectChat(currentUid, user.id);

    return true;
  }

  /** Erstellt oder laedt den Direktchat und startet den Listener. */
  private async createDirectChat(currentUid: string, userId: string): Promise<void> {
    const dmId = await this.messageService.getOrCreateDirectChat(currentUid, userId);

    this.dmId.set(dmId);
    this.subscribeDirectMessages();
  }

  /** Laedt beim Start den ersten vorhandenen Channel. */
  async loadInitialChannel(): Promise<void> {
    await this.waitForAuth();
    const channels = await this.channelService.listChannels();
    const channel = channels[0];

    if (!channel) return;

    this.switchChannel(channel);
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

  /** Bereitet den Wechsel auf einen anderen Chat vor. */
  private prepareChatSwitch(): void {
    this.stopMessageListener();
    this.channelId.set(null);
    this.dmId.set(null);
    this.directUser.set(null);
    this.profileService.closeProfile();
    this.messages.set([]);
  }

  /** Beobachtet Nachrichten des aktuellen Channels. */
  private subscribeChannelMessages(): void {
    const channelId = this.channelId();
    if (!channelId) return;

    this.unsubscribeMessages = this.messageService.subscribeChannelMessages(channelId, (messages) =>
      this.handleMessages(messages),
    );
  }

  /** Beobachtet Nachrichten des aktuellen Direktchats. */
  private subscribeDirectMessages(): void {
    const dmId = this.dmId();
    if (!dmId) return;

    this.unsubscribeMessages = this.messageService.subscribeDirectMessages(dmId, (messages) =>
      this.handleMessages(messages),
    );
  }

  /** Aktualisiert Nachrichten und Absenderprofile. */
  private handleMessages(messages: Message[]): void {
    this.messages.set(messages);
    void this.profileService.loadSenderProfiles(messages);
  }

  /** Beendet den bisherigen Firestore-Listener. */
  private stopMessageListener(): void {
    this.unsubscribeMessages?.();
    this.unsubscribeMessages = null;
  }
}
