import {
  Component,
  inject,
  Input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Unsubscribe } from 'firebase/firestore';
import { Icon } from '../../../shared/icon/icon';
import { ChannelService } from '../../../shared/channel/channel.service';
import { MessageService } from '../../../shared/message/message';
import { FIREBASE_AUTH } from '../../../shared/firebase/firebase.tokens';
import {
  Channel,
  Message,
  User,
} from '../../../shared/models';
import { UserService } from '../../../shared/user/user.service';
import { ProfileCard } from '../../profile/profile-card/profile-card';
import {
  AttachmentData,
  MainChatUploadService,
} from './main-chat-upload.service';
import { MainChatReactionService } from './main-chat-reaction.service';
import type { ReactionGroup } from './main-chat-reaction.service';
import { MainChatProfileService } from './main-chat-profile.service';

/** Verwaltet Channel- und Direktnachrichten. */
@Component({
  selector: 'app-main-chat',
  imports: [
    Icon,
    ProfileCard,
  ],
  providers: [
    MainChatProfileService,
    MainChatReactionService,
    MainChatUploadService,
  ],
  templateUrl: './main-chat.html',
  styleUrl: './main-chat.scss',
})
export class MainChat implements OnInit, OnDestroy {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly channelService = inject(ChannelService);
  private readonly messageService = inject(MessageService);
  private readonly profileService = inject(MainChatProfileService);
  private readonly reactionService = inject(MainChatReactionService);
  private readonly uploadService = inject(MainChatUploadService);
  private readonly userService = inject(UserService);

  private unsubscribeMessages: Unsubscribe | null = null;
  private inputChannel: Channel | null = null;
  private inputUser: User | null = null;

  protected readonly channelName = signal('');
  protected readonly messages = signal<Message[]>([]);
  protected readonly directUser = signal<User | null>(null);

  protected readonly selectedProfileUserId =
    signal<string | null>(null);

  protected readonly activeReactionMessageId =
    this.reactionService.activeReactionMessageId;

  protected readonly reactionOptions =
    this.reactionService.reactionOptions;

  protected channelId: string | null = null;
  protected dmId: string | null = null;
  protected selectedFile: File | null = null;
  protected messageText = '';

  protected readonly memberAvatars = [
    'img/avatar/avatar01.svg',
    'img/avatar/avatar02.svg',
    'img/avatar/avatar03.svg',
  ];

  /** Uebernimmt einen ausgewaehlten Channel. */
  @Input()
  set channel(channel: Channel | null) {
    this.inputChannel = channel;

    if (!channel) return;

    this.inputUser = null;
    this.switchChannel(channel);
  }

  /** Uebernimmt einen ausgewaehlten Direktchat-User. */
  @Input()
  set user(user: User | null) {
    this.inputUser = user;

    if (!user) return;

    this.inputChannel = null;
    void this.switchDirectChat(user);
  }

  /** Initialisiert beim Start den ersten Channel. */
  async ngOnInit(): Promise<void> {
    if (this.inputChannel || this.inputUser) return;

    await this.loadInitialChannel();
  }

  /** Beendet den aktiven Nachrichten-Listener. */
  ngOnDestroy(): void {
    this.stopMessageListener();
  }

  /** Wechselt auf einen Channel. */
  private switchChannel(channel: Channel): void {
    if (this.channelId === channel.id && !this.dmId) return;

    this.stopMessageListener();
    this.resetChatState();

    this.channelId = channel.id;
    this.channelName.set(channel.name);

    this.subscribeChannelMessages();
  }

  /** Wechselt auf einen Direktchat. */
  private async switchDirectChat(user: User): Promise<void> {
    const currentUid = this.auth.currentUser?.uid;

    if (!currentUid) return;

    this.stopMessageListener();
    this.resetChatState();

    this.directUser.set(user);
    this.channelName.set(user.name);

    this.dmId =
      await this.messageService.getOrCreateDirectChat(
        currentUid,
        user.id,
      );

    this.subscribeDirectMessages();
  }

  /** Entfernt den Zustand des vorherigen Chats. */
  private resetChatState(): void {
    this.channelId = null;
    this.dmId = null;
    this.directUser.set(null);
    this.selectedProfileUserId.set(null);
    this.messages.set([]);
    this.messageText = '';
    this.selectedFile = null;
  }

  /** Laedt beim Start den ersten Channel. */
  private async loadInitialChannel(): Promise<void> {
    const channels = await this.channelService.listChannels();
    const channel = channels[0];

    if (!channel) return;

    this.switchChannel(channel);
  }

  /** Beobachtet Nachrichten des aktuellen Channels. */
  private subscribeChannelMessages(): void {
    if (!this.channelId) return;

    this.unsubscribeMessages =
      this.messageService.subscribeChannelMessages(
        this.channelId,
        (messages) => this.handleMessages(messages),
      );
  }

  /** Beobachtet Nachrichten des aktuellen Direktchats. */
  private subscribeDirectMessages(): void {
    if (!this.dmId) return;

    this.unsubscribeMessages =
      this.messageService.subscribeDirectMessages(
        this.dmId,
        (messages) => this.handleMessages(messages),
      );
  }

  /** Beendet den bisherigen Firestore-Listener. */
  private stopMessageListener(): void {
    this.unsubscribeMessages?.();
    this.unsubscribeMessages = null;
  }

  /** Aktualisiert Nachrichten und Absenderprofile. */
  private handleMessages(messages: Message[]): void {
    this.messages.set(messages);
    void this.profileService.loadSenderProfiles(messages);
  }

  /** Liefert den Anzeigenamen eines Absenders. */
  protected getSenderName(senderId: string): string {
    return this.profileService.getSenderName(senderId);
  }

  /** Liefert das Avatar eines Absenders. */
  protected getSenderAvatar(senderId: string): string {
    return this.profileService.getSenderAvatar(senderId);
  }

  /** Oeffnet das Profil eines Nachrichten-Absenders. */
  protected openProfile(userId: string): void {
    this.selectedProfileUserId.set(userId);
  }

  /** Schliesst das aktuell geoeffnete Profil. */
  protected closeProfile(): void {
    this.selectedProfileUserId.set(null);
  }

  /** Oeffnet aus einem Profil den zugehoerigen Direktchat. */
  protected async openDirectChat(userId: string): Promise<void> {
    const user = await this.userService.getUser(userId);

    if (!user) return;

    this.closeProfile();
    this.inputChannel = null;
    this.inputUser = user;

    await this.switchDirectChat(user);
  }

  /** Formatiert den Zeitpunkt einer Nachricht. */
  protected formatMessageTime(timestamp: number): string {
    return this.profileService.formatMessageTime(timestamp);
  }

  /** Liefert die sichtbaren Reactions. */
  protected getReactionGroups(
    message: Message,
  ): ReactionGroup[] {
    return this.reactionService.getReactionGroups(message);
  }

  /** Liefert die Anzahl ausgeblendeter Reactions. */
  protected getHiddenReactionCount(message: Message): number {
    return this.reactionService.getHiddenReactionCount(message);
  }

  /** Prueft, ob die Reaction-Liste erweitert ist. */
  protected isReactionsExpanded(messageId: string): boolean {
    return this.reactionService.isExpanded(messageId);
  }

  /** Oeffnet oder reduziert die Reaction-Liste. */
  protected toggleReactionList(messageId: string): void {
    this.reactionService.toggleExpanded(messageId);
  }

  /** Oeffnet oder schliesst die Emoji-Auswahl. */
  protected toggleReactionPicker(messageId: string): void {
    this.reactionService.toggleReactionPicker(messageId);
  }

  /** Fuegt eine Reaction hinzu oder entfernt sie. */
  protected async toggleReaction(
    message: Message,
    emoji: string,
  ): Promise<void> {
    await this.reactionService.toggleReaction(
      message,
      emoji,
      this.channelId,
    );
  }

  /** Prueft, ob ein Datumstrenner angezeigt wird. */
  protected showDateSeparator(index: number): boolean {
    if (index === 0) return true;

    const messages = this.messages();

    const current =
      new Date(messages[index].timestamp);

    const previous =
      new Date(messages[index - 1].timestamp);

    return !this.isSameDay(current, previous);
  }

  /** Formatiert das Datum eines Nachrichtentrenners. */
  protected formatDateSeparator(timestamp: number): string {
    const date = new Date(timestamp);

    if (this.isToday(date)) return 'Heute';
    if (this.isYesterday(date)) return 'Gestern';

    return this.formatFullDate(date);
  }

  /** Prueft, ob zwei Zeitpunkte am selben Tag liegen. */
  private isSameDay(first: Date, second: Date): boolean {
    return first.getFullYear() === second.getFullYear()
      && first.getMonth() === second.getMonth()
      && first.getDate() === second.getDate();
  }

  /** Prueft, ob ein Datum heute ist. */
  private isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  /** Prueft, ob ein Datum gestern war. */
  private isYesterday(date: Date): boolean {
    const yesterday = new Date();

    yesterday.setDate(
      yesterday.getDate() - 1,
    );

    return this.isSameDay(date, yesterday);
  }

  /** Formatiert ein aelteres Datum. */
  private formatFullDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  }

  /** Reagiert auf die Mitgliederverwaltung. */
  protected onAddMembers(): void {
    console.log('[main-chat] add members clicked');
  }

  /** Uebernimmt den Inhalt des Nachrichtenfeldes. */
  protected onMessageInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement;

    this.messageText = input.value;
  }

  /** Bereitet eine ausgewaehlte Datei vor. */
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.selectedFile =
      this.uploadService.prepareSelectedFile(file);
  }

  /** Sendet eine Nachricht mit optionalem Anhang. */
  protected async onSend(): Promise<void> {
    const text = this.messageText.trim();
    const senderId = this.auth.currentUser?.uid;

    if (!this.canSendMessage(text, senderId)) return;

    const attachment =
      await this.getAttachmentData();

    if (!attachment || !senderId) return;

    await this.saveMessage(
      text,
      senderId,
      attachment,
    );

    this.messageText = '';
  }

  /** Prueft die Voraussetzungen fuer den Versand. */
  private canSendMessage(
    text: string,
    senderId: string | undefined,
  ): boolean {
    if (!text && !this.selectedFile) return false;
    if (!senderId) return false;

    return !!this.channelId || !!this.dmId;
  }

  /** Erstellt die Anhangsdaten einer Nachricht. */
  private async getAttachmentData(): Promise<AttachmentData | null> {
    const attachment =
      await this.uploadService.getAttachmentData(
        this.selectedFile,
      );

    if (attachment && this.selectedFile) {
      this.selectedFile = null;
    }

    return attachment;
  }

  /** Speichert eine Nachricht im aktuellen Chat. */
  private async saveMessage(
    text: string,
    senderId: string,
    attachment: AttachmentData,
  ): Promise<void> {
    if (this.channelId) {
      await this.saveChannelMessage(
        text,
        senderId,
        attachment,
      );

      return;
    }

    await this.saveDirectMessage(
      text,
      senderId,
      attachment,
    );
  }

  /** Speichert eine Channel-Nachricht. */
  private async saveChannelMessage(
    text: string,
    senderId: string,
    attachment: AttachmentData,
  ): Promise<void> {
    if (!this.channelId) return;

    await this.messageService.sendChannelMessage(
      this.channelId,
      senderId,
      text,
      attachment.path ?? undefined,
      attachment.name ?? undefined,
    );
  }

  /** Speichert eine Direktnachricht. */
  private async saveDirectMessage(
    text: string,
    senderId: string,
    attachment: AttachmentData,
  ): Promise<void> {
    if (!this.dmId) return;

    await this.messageService.sendDirectMessage(
      this.dmId,
      senderId,
      text,
      attachment.path ?? undefined,
      attachment.name ?? undefined,
    );
  }

  /** Prueft, ob die Nachricht vom aktuellen User stammt. */
  protected isOwnMessage(senderId: string): boolean {
    return this.auth.currentUser?.uid === senderId;
  }

  /** Prueft, ob aktuell ein Direktchat angezeigt wird. */
  protected isDirectChat(): boolean {
    return this.dmId !== null;
  }

  /** Liefert den Placeholder des Nachrichtenfeldes. */
  protected getMessagePlaceholder(): string {
    if (this.isDirectChat()) {
      return `Nachricht an ${this.channelName()}`;
    }

    return `Nachricht an #${this.channelName()}`;
  }

  /** Oeffnet einen privaten Nachrichtenanhang. */
  protected async openAttachment(
    attachmentPath: string,
  ): Promise<void> {
    await this.uploadService.openAttachment(
      attachmentPath,
    );
  }

  /** Entfernt die aktuell ausgewaehlte Datei. */
  protected removeSelectedFile(): void {
    this.selectedFile = null;
  }
}