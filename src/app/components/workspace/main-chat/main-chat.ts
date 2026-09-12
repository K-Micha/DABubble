import { Component, inject, OnInit, signal } from '@angular/core';
import { Icon } from '../../../shared/icon/icon';
import { supabase } from '../../../shared/supabase/supabase';
import { ChannelService } from '../../../shared/channel/channel.service';
import { MessageService } from '../../../shared/message/message';
import { FIREBASE_AUTH } from '../../../shared/firebase/firebase.tokens';

/** Beschreibt die optionalen Daten eines Nachrichtenanhangs. */
type AttachmentData = {
  path: string | null;
  name: string | null;
};

/** Verwaltet die Nachrichtenansicht, den Versand und Dateianhaenge eines Channels. */
@Component({
  selector: 'app-main-chat',
  imports: [Icon],
  templateUrl: './main-chat.html',
  styleUrl: './main-chat.scss',
})
export class MainChat implements OnInit {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly channelService = inject(ChannelService);
  private readonly messageService = inject(MessageService);

  protected readonly channelName = signal('');
  protected channelId: string | null = null;

  protected readonly memberAvatars = [
    'img/avatar/avatar01.svg',
    'img/avatar/avatar02.svg',
    'img/avatar/avatar03.svg',
  ];

  protected selectedFile: File | null = null;
  protected messageText = '';

  protected readonly messages: {
    text: string;
    attachmentPath: string | null;
    attachmentName: string | null;
  }[] = [];

  /** Initialisiert den aktuell angezeigten Channel. */
  async ngOnInit(): Promise<void> {
    await this.loadCurrentChannel();
  }

  /** Reagiert auf das Oeffnen der Mitgliederverwaltung. */
  protected onAddMembers(): void {
    console.log('[main-chat] add members clicked');
  }

  /** Laedt den aktuell verwendeten Channel aus Firestore. */
  private async loadCurrentChannel(): Promise<void> {
    const channels = await this.channelService.listChannels();
    const channel = channels[0];

    if (!channel) {
      console.error('[main-chat] no channels found');
      return;
    }

    this.channelId = channel.id;
    this.channelName.set(channel.name);
  }

  /** Uebernimmt den aktuellen Inhalt des Nachrichtenfeldes. */
  protected onMessageInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.messageText = input.value;
  }

  /** Bereitet eine ausgewaehlte Datei fuer den Nachrichtenversand vor. */
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const extension = this.getFileExtension(file.name);
    const fileName = this.createShortFileName(file.name);

    this.selectedFile = new File(
      [file],
      `${fileName}${extension}`,
      { type: file.type }
    );
  }

  /** Sendet eine Textnachricht mit optionalem Dateianhang. */
  protected async onSend(): Promise<void> {
    const text = this.messageText.trim();
    const senderId = this.auth.currentUser?.uid;

    if (!this.canSendMessage(text, senderId)) return;

    const attachment = await this.getAttachmentData();
    if (!attachment || !senderId || !this.channelId) return;

    await this.saveMessage(text, senderId, this.channelId, attachment);
    this.messageText = '';
  }

  /** Prueft die notwendigen Voraussetzungen fuer den Nachrichtenversand. */
  private canSendMessage(
    text: string,
    senderId: string | undefined,
  ): boolean {
    if (!text && !this.selectedFile) return false;
    if (!senderId || !this.channelId) return false;

    return true;
  }

  /** Erstellt die Anhangsdaten und laedt eine vorhandene Datei hoch. */
  private async getAttachmentData(): Promise<AttachmentData | null> {
    if (!this.selectedFile) {
      return { path: null, name: null };
    }

    const name = this.selectedFile.name;
    const path = await this.uploadSelectedFile();

    if (!path) return null;

    return { path, name };
  }

  /** Speichert die Nachricht in Firestore und fuegt sie lokal hinzu. */
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

    this.addLocalMessage(text, attachment);
  }

  /** Fuegt eine gesendete Nachricht der lokalen Nachrichtenliste hinzu. */
  private addLocalMessage(
    text: string,
    attachment: AttachmentData,
  ): void {
    this.messages.push({
      text,
      attachmentPath: attachment.path,
      attachmentName: attachment.name,
    });
  }

  /** Laedt die ausgewaehlte Datei in den Supabase-Storage hoch. */
  protected async uploadSelectedFile(): Promise<string | null> {
    if (!this.selectedFile) return null;

    const filePath = this.createFilePath(this.selectedFile.name);
    const result = await this.uploadFile(filePath, this.selectedFile);

    if (!result) return null;

    this.selectedFile = null;
    return result;
  }

  /** Speichert eine Datei im Bucket fuer Chat-Anhaenge. */
  private async uploadFile(
    filePath: string,
    file: File,
  ): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file);

    if (error) {
      console.error('[main-chat] upload failed:', error);
      return null;
    }

    return data.path;
  }

  /** Oeffnet einen privaten Anhang ueber eine temporaere Signed URL. */
  protected async openAttachment(
    attachmentPath: string,
  ): Promise<void> {
    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .createSignedUrl(attachmentPath, 60);

    if (error) return this.logAttachmentError(error);

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  /** Protokolliert Fehler beim Oeffnen eines Nachrichtenanhangs. */
  private logAttachmentError(error: unknown): void {
    console.error('[main-chat] open attachment failed:', error);
  }

  /** Entfernt die aktuell ausgewaehlte Datei vor dem Senden. */
  protected removeSelectedFile(): void {
    this.selectedFile = null;
  }

  /** Erzeugt einen eindeutigen Storage-Pfad fuer einen Dateianhang. */
  private createFilePath(fileName: string): string {
    return `${Date.now()}-${fileName}`;
  }

  /** Kuerzt einen Dateinamen auf maximal sechs Zeichen vor der Endung. */
  private createShortFileName(fileName: string): string {
    return fileName
      .replace(/\.[^/.]+$/, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .slice(0, 6);
  }

  /** Ermittelt die Dateiendung eines ausgewaehlten Anhangs. */
  private getFileExtension(fileName: string): string {
    const match = fileName.match(/\.[^/.]+$/);

    return match?.[0].toLowerCase() ?? '';
  }
}