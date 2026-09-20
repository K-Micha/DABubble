import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { ClickOutsideDirective } from '../../../shared/click-outside/click-outside.directive';
import { FIREBASE_AUTH } from '../../../shared/firebase/firebase.tokens';
import { Icon } from '../../../shared/icon/icon';
import { MessageService } from '../../../shared/message/message';
import { Channel, Message, User } from '../../../shared/models';
import { ChannelInfo } from '../../channel/channel-info/channel-info';
import { ProfileCard } from '../../profile/profile-card/profile-card';
import { MainChatDateService } from './main-chat-date.service';
import { MainChatProfileService } from './main-chat-profile.service';
import { MainChatReactionService } from './main-chat-reaction.service';
import type { ReactionGroup } from './main-chat-reaction.service';
import { MainChatSessionService } from './main-chat-session.service';
import { AttachmentData, MainChatUploadService } from './main-chat-upload.service';

/** Verwaltet Darstellung und Eingaben des Main-Chats. */
@Component({
  selector: 'app-main-chat',
  imports: [Icon, ProfileCard, ChannelInfo, ClickOutsideDirective],
  providers: [
    MainChatDateService,
    MainChatProfileService,
    MainChatReactionService,
    MainChatSessionService,
    MainChatUploadService,
  ],
  templateUrl: './main-chat.html',
  styleUrl: './main-chat.scss',
})
export class MainChat implements OnInit {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly messageService = inject(MessageService);
  private readonly dateService = inject(MainChatDateService);
  private readonly profileService = inject(MainChatProfileService);
  private readonly reactionService = inject(MainChatReactionService);
  private readonly sessionService = inject(MainChatSessionService);
  private readonly uploadService = inject(MainChatUploadService);

  protected readonly channelName = this.sessionService.channelName;

  protected readonly messages = this.sessionService.messages;

  protected readonly directUser = this.sessionService.directUser;

  protected readonly selectedProfileUserId = this.profileService.selectedProfileUserId;

  protected readonly selectedChannelInfoId = this.profileService.selectedChannelInfoId;

  protected readonly activeReactionMessageId = this.reactionService.activeReactionMessageId;

  protected readonly reactionOptions = this.reactionService.reactionOptions;

  protected selectedFile: File | null = null;
  protected messageText = '';

  protected readonly memberAvatars = [
    'img/avatar/avatar01.svg',
    'img/avatar/avatar02.svg',
    'img/avatar/avatar03.svg',
  ];

  /** Nachricht, auf die im Thread-Panel geantwortet werden soll. */
  @Output() replyClicked = new EventEmitter<Message>();

  /** Uebernimmt einen ausgewaehlten Channel. */
  @Input()
  set channel(channel: Channel | null) {
    if (!channel) return;

    const switched = this.sessionService.switchChannel(channel);

    if (switched) this.resetComposer();
  }

  /** Uebernimmt einen ausgewaehlten Direktchat-User. */
  @Input()
  set user(user: User | null) {
    if (!user) return;

    void this.selectDirectUser(user);
  }

  /** Initialisiert beim Start den ersten Channel. */
  async ngOnInit(): Promise<void> {
    if (this.sessionService.hasActiveChat()) return;

    await this.sessionService.loadInitialChannel();
  }

  /** Wechselt auf einen ausgewaehlten Direktchat. */
  private async selectDirectUser(user: User): Promise<void> {
    const switched = await this.sessionService.switchDirectChat(user);

    if (switched) this.resetComposer();
  }

  /** Leert den Nachrichtenentwurf beim Chatwechsel. */
  private resetComposer(): void {
    this.messageText = '';
    this.selectedFile = null;
  }

  /** Oeffnet die Channel-Informationen. */
  protected openChannelInfo(): void {
    this.profileService.openChannelInfo(this.sessionService.channelId());
  }

  /** Schliesst die Channel-Informationen. */
  protected closeChannelInfo(): void {
    this.profileService.closeChannelInfo();
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
    this.profileService.openProfile(userId);
  }

  /** Schliesst das aktuell geoeffnete Profil. */
  protected closeProfile(): void {
    this.profileService.closeProfile();
  }

  /** Oeffnet aus einem Profil den zugehoerigen Direktchat. */
  protected async openDirectChat(userId: string): Promise<void> {
    const user = await this.profileService.getUser(userId);

    if (!user) return;

    this.closeProfile();
    await this.selectDirectUser(user);
  }

  /** Formatiert den Zeitpunkt einer Nachricht. */
  protected formatMessageTime(timestamp: number): string {
    return this.profileService.formatMessageTime(timestamp);
  }

  /** Liefert die sichtbaren Reactions. */
  protected getReactionGroups(message: Message): ReactionGroup[] {
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
  protected async toggleReaction(message: Message, emoji: string): Promise<void> {
    await this.reactionService.toggleReaction(message, emoji, this.sessionService.channelId());
  }

  /** Prueft, ob ein Datumstrenner angezeigt wird. */
  protected showDateSeparator(index: number): boolean {
    return this.dateService.showDateSeparator(this.messages(), index);
  }

  /** Formatiert das Datum eines Nachrichtentrenners. */
  protected formatDateSeparator(timestamp: number): string {
    return this.dateService.formatDateSeparator(timestamp);
  }

  /** Reagiert auf die Mitgliederverwaltung. */
  protected onAddMembers(): void {
    console.log('[main-chat] add members clicked');
  }

  /** Oeffnet das Thread-Panel fuer eine Nachricht. */
  protected onReply(message: Message): void {
    this.replyClicked.emit(message);
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

    this.selectedFile = this.uploadService.prepareSelectedFile(file);
  }

  /** Sendet eine Nachricht mit optionalem Anhang. */
  protected async onSend(): Promise<void> {
    const text = this.messageText.trim();
    const senderId = this.auth.currentUser?.uid;

    if (!this.canSendMessage(text, senderId)) return;

    const attachment = await this.getAttachmentData();

    if (!attachment || !senderId) return;

    await this.saveMessage(text, senderId, attachment);
    this.messageText = '';
  }

  /** Prueft die Voraussetzungen fuer den Versand. */
  private canSendMessage(text: string, senderId: string | undefined): boolean {
    if (!text && !this.selectedFile) return false;
    if (!senderId) return false;

    return this.sessionService.hasActiveChat();
  }

  /** Erstellt die Anhangsdaten einer Nachricht. */
  private async getAttachmentData(): Promise<AttachmentData | null> {
    const attachment = await this.uploadService.getAttachmentData(this.selectedFile);

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
    const channelId = this.sessionService.channelId();

    if (channelId) {
      await this.saveChannelMessage(channelId, text, senderId, attachment);

      return;
    }

    await this.saveDirectMessage(text, senderId, attachment);
  }

  /** Speichert eine Channel-Nachricht. */
  private async saveChannelMessage(
    channelId: string,
    text: string,
    senderId: string,
    attachment: AttachmentData,
  ): Promise<void> {
    await this.messageService.sendChannelMessage(
      channelId,
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
    const dmId = this.sessionService.dmId();
    if (!dmId) return;

    await this.messageService.sendDirectMessage(
      dmId,
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
    return !!this.sessionService.dmId();
  }

  /** Liefert den Placeholder des Nachrichtenfeldes. */
  protected getMessagePlaceholder(): string {
    if (this.isDirectChat()) {
      return `Nachricht an ${this.channelName()}`;
    }

    return `Nachricht an #${this.channelName()}`;
  }

  /** Oeffnet einen privaten Nachrichtenanhang. */
  protected async openAttachment(attachmentPath: string): Promise<void> {
    await this.uploadService.openAttachment(attachmentPath);
  }

  /** Entfernt die aktuell ausgewaehlte Datei. */
  protected removeSelectedFile(): void {
    this.selectedFile = null;
  }
}
