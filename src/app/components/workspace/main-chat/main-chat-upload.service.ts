import { Injectable } from '@angular/core';
import { supabase } from '../../../shared/supabase/supabase';

/** Beschreibt die optionalen Daten eines Nachrichtenanhangs. */
export type AttachmentData = {
  path: string | null;
  name: string | null;
};

/** Verwaltet Uploads und Dateianhaenge des Main-Chats. */
@Injectable()
export class MainChatUploadService {
  /** Bereitet eine ausgewaehlte Datei fuer den Versand vor. */
  prepareSelectedFile(file: File): File {
    const extension = this.getFileExtension(file.name);
    const fileName = this.createShortFileName(file.name);

    return new File(
      [file],
      `${fileName}${extension}`,
      { type: file.type },
    );
  }

  /** Erstellt die Anhangsdaten und laedt die Datei hoch. */
  async getAttachmentData(
    file: File | null,
  ): Promise<AttachmentData | null> {
    if (!file) return { path: null, name: null };

    const path = await this.uploadFile(file);
    if (!path) return null;

    return {
      path,
      name: file.name,
    };
  }

  /** Laedt eine Datei in den Supabase-Storage hoch. */
  private async uploadFile(file: File): Promise<string | null> {
    const filePath = this.createFilePath(file.name);
    const { data, error } = await this.upload(filePath, file);

    if (error) {
      console.error('[main-chat] upload failed:', error);
      return null;
    }

    return data.path;
  }

  /** Fuehrt den eigentlichen Upload in Supabase aus. */
  private async upload(filePath: string, file: File) {
    return supabase.storage
      .from('chat-attachments')
      .upload(filePath, file);
  }

  /** Oeffnet einen privaten Anhang ueber eine Signed URL. */
  async openAttachment(attachmentPath: string): Promise<void> {
    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .createSignedUrl(attachmentPath, 60);

    if (error) {
      this.logAttachmentError(error);
      return;
    }

    window.open(
      data.signedUrl,
      '_blank',
      'noopener,noreferrer',
    );
  }

  /** Protokolliert Fehler beim Oeffnen eines Anhangs. */
  private logAttachmentError(error: unknown): void {
    console.error(
      '[main-chat] open attachment failed:',
      error,
    );
  }

  /** Erzeugt einen eindeutigen Storage-Pfad. */
  private createFilePath(fileName: string): string {
    return `${Date.now()}-${fileName}`;
  }

  /** Kuerzt einen Dateinamen auf sechs Zeichen. */
  private createShortFileName(fileName: string): string {
    return fileName
      .replace(/\.[^/.]+$/, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .slice(0, 6);
  }

  /** Ermittelt die Dateiendung eines Anhangs. */
  private getFileExtension(fileName: string): string {
    const match = fileName.match(/\.[^/.]+$/);

    return match?.[0].toLowerCase() ?? '';
  }
}