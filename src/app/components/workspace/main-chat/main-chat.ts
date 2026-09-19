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
import { Channel, Message } from '../../../shared/models';
import {
  AttachmentData,
  MainChatUploadService,
} from './main-chat-upload.service';
import { MainChatReactionService } from './main-chat-reaction.service';
import type { ReactionGroup } from './main-chat-reaction.service';
import { MainChatProfileService } from './main-chat-profile.service';

/** Verwaltet die Nachrichtenansicht eines Channels. */
@Component({
  selector: 'app-main-chat',
  imports: [Icon],
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

  private unsubscribeMessages: Unsubscribe | null = null;
  private inputChannel: Channel | null = null;

  protected readonly channelName = signal('');
  protected readonly messages = signal<Message[]>([]);

  protected readonly activeReactionMessageId =
    this.reactionService.activeReactionMessageId;

  protected readonly reactionOptions =
    this.reactionService.reactionOptions;

  protected channelId: string | null = null;
  protected selectedFile: File | null = null;
  protected messageText = '';

  protected readonly memberAvatars = [
    'img/avatar/avatar01.svg',
    'img/avatar/avatar02.svg',
    'img/avatar/avatar03.svg',
  ];

  /** Uebernimmt einen ausgewaehlten Channel aus dem Workspace. */
  @Input()
  set channel(channel: Channel | null) {
    this.inputChannel = channel;

    if (channel) {
      this.switchChannel(channel);
    }
  }

  /** Initialisiert den ersten Channel, solange noch keiner uebergeben wurde. */
  async ngOnInit(): Promise<void> {
    if (this.inputChannel) return;

    await this.loadInitialChannel();
  }

  /** Beendet den Firestore-Listener. */
  ngOnDestroy(): void {
    this.stopMessageListener();
  }

  /** Wechselt den aktiven Channel. */
  private switchChannel(channel: Channel): void {
    if (this.channelId === channel.id) return;

    this.stopMessageListener();
    this.channelId = channel.id;
    this.channelName.set(channel.name);
    this.messages.set([]);
    this.subscribeToMessages();
  }

  /** Laedt beim Start den ersten vorhandenen Channel. */
  private async loadInitialChannel(): Promise<void> {
    const channels = await this.channelService.listChannels();
    const channel = channels[0];

    if (!channel) {
      console.error('[main-chat] no channels found');
      return;
    }

    this.switchChannel(channel);
  }

  /** Startet den Echtzeit-Listener fuer den aktuellen Channel. */
  private subscribeToMessages(): void {
    if (!this.channelId) return;

    this.unsubscribeMessages =
      this.messageService.subscribeChannelMessages(
        this.channelId,
        (messages) => this.handleMessages(messages),
      );
  }

  /** Beendet den aktuell laufenden Nachrichten-Listener. */
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

  /** Formatiert den Zeitpunkt einer Nachricht. */
  protected formatMessageTime(timestamp: number): string {
    return this.profileService.formatMessageTime(timestamp);
  }

  /** Liefert die sichtbaren Reactions einer Nachricht. */
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
    const current = new Date(messages[index].timestamp);
    const previous = new Date(messages[index - 1].timestamp);

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
    yesterday.setDate(yesterday.getDate() - 1);

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

  /** Reagiert auf das Oeffnen der Mitgliederverwaltung. */
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

    const attachment = await this.getAttachmentData();

    if (!attachment || !senderId || !this.channelId) return;

    await this.saveMessage(
      text,
      senderId,
      this.channelId,
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
    if (!senderId || !this.channelId) return false;

    return true;
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

  /** Speichert eine Nachricht in Firestore. */
  private async saveMessage(
    text: string,
    senderId: string,
    channelId: string,
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

  /** Prueft, ob die Nachricht vom aktuellen User stammt. */
  protected isOwnMessage(senderId: string): boolean {
    return this.auth.currentUser?.uid === senderId;
  }

  /** Oeffnet einen privaten Nachrichtenanhang. */
  protected async openAttachment(
    attachmentPath: string,
  ): Promise<void> {
    await this.uploadService.openAttachment(attachmentPath);
  }

  /** Entfernt die aktuell ausgewaehlte Datei. */
  protected removeSelectedFile(): void {
    this.selectedFile = null;
  }
}