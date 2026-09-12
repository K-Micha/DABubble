import { Component } from '@angular/core';
import { Icon } from '../../../shared/icon/icon';
import { supabase } from '../../../shared/supabase/supabase';

/**
 * Grobes Platzhalter-Layout fuer die Chat-Mittelspalte (Spalte 2). Rein
 * strukturell/optisch - die echte Nachrichten-Anzeige und Sende-Logik baut
 * Michael hier weiter aus.
 */
@Component({
  selector: 'app-main-chat',
  imports: [Icon],
  templateUrl: './main-chat.html',
  styleUrl: './main-chat.scss',
})
export class MainChat {
  // TODO: sobald die Sidebar-Auswahl echt durchgereicht wird, hier den
  // tatsaechlich ausgewaehlten Channel statt Platzhalter-Werten anzeigen.
  protected readonly channelName = 'Allgemein';

  protected readonly memberAvatars = [
    'img/avatar/avatar01.svg',
    'img/avatar/avatar02.svg',
    'img/avatar/avatar03.svg',
  ];

  protected selectedFile: File | null = null;
  protected messageText = '';

  protected readonly messages: {
    text: string;
    attachment: string | null;
  }[] = [];

  // TODO: an channel-add-members andocken, sobald hier ein echter
  // channelId aus der Sidebar-Auswahl ankommt.
  protected onAddMembers(): void {
    console.log('[main-chat] add members clicked');
  }

  /**
   * Uebernimmt den aktuellen Inhalt des Nachrichtenfeldes.
   */
  protected onMessageInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.messageText = input.value;
  }

  /**
   * Uebernimmt eine ausgewaehlte Datei aus dem File-Input,
   * kuerzt den Dateinamen und haelt sie bis zum Senden lokal vor.
   */
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

  /**
   * Sendet Text und optional eine Datei.
   * Die Nachricht wird aktuell nur lokal im Chat angezeigt.
   */
  protected async onSend(): Promise<void> {
    const message = this.messageText.trim();

    if (!message && !this.selectedFile) return;

    let filePath: string | null = null;

    if (this.selectedFile) {
      filePath = await this.uploadSelectedFile();

      if (!filePath) return;
    }

    this.messages.push({
      text: message,
      attachment: filePath,
    });

    this.messageText = '';
  }

  /**
   * Laedt die ausgewaehlte Datei in den Supabase-Storage
   * und gibt bei Erfolg den gespeicherten Pfad zurueck.
   */
  protected async uploadSelectedFile(): Promise<string | null> {
    if (!this.selectedFile) return null;

    const filePath = this.createFilePath(this.selectedFile.name);

    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, this.selectedFile);

    if (error) {
      console.error('[main-chat] upload failed:', error);
      return null;
    }

    this.selectedFile = null;

    return data.path;
  }

  /**
   * Entfernt die aktuell ausgewaehlte Datei.
   */
  protected removeSelectedFile(): void {
    this.selectedFile = null;
  }

  /**
   * Erzeugt einen eindeutigen Dateipfad fuer den Storage.
   */
  private createFilePath(fileName: string): string {
    return `${Date.now()}-${fileName}`;
  }

  /**
   * Kuerzt den sichtbaren Dateinamen auf sechs Zeichen.
   */
  private createShortFileName(fileName: string): string {
    return fileName
      .replace(/\.[^/.]+$/, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .slice(0, 6);
  }

  /**
   * Liest die Dateiendung aus und behaelt sie bei.
   */
  private getFileExtension(fileName: string): string {
    const match = fileName.match(/\.[^/.]+$/);

    return match?.[0].toLowerCase() ?? '';
  }
}