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

  // TODO: an channel-add-members andocken, sobald hier ein echter
  // channelId aus der Sidebar-Auswahl ankommt.
  protected onAddMembers(): void {
    console.log('[main-chat] add members clicked');
  }
}
