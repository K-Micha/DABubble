import { Component } from '@angular/core';
import { Icon } from '../../../shared/icon/icon';

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

  // TODO: an channel-add-members andocken, sobald hier ein echter
  // channelId aus der Sidebar-Auswahl ankommt.
  protected onAddMembers(): void {
    console.log('[main-chat] add members clicked');
  }

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

  protected removeSelectedFile(): void {
    this.selectedFile = null;
  }

  private createShortFileName(fileName: string): string {
    return fileName
      .replace(/\.[^/.]+$/, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .slice(0, 6);
  }

  private getFileExtension(fileName: string): string {
    const match = fileName.match(/\.[^/.]+$/);

    return match?.[0].toLowerCase() ?? '';
  }
}