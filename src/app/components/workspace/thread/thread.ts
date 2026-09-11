import { Component, output } from '@angular/core';
import { Icon } from '../../../shared/icon/icon';

/**
 * Grobes Platzhalter-Layout fuer das Thread-Panel (Spalte 3). Rein
 * strukturell/optisch - echte Thread-Antworten baut Michael hier weiter aus.
 */
@Component({
  selector: 'app-thread',
  imports: [Icon],
  templateUrl: './thread.html',
  styleUrl: './thread.scss',
})
export class Thread {
  // TODO: sobald eine echte Thread-Auswahl existiert, hier den
  // tatsaechlichen Channel-Namen statt Platzhalter anzeigen.
  protected readonly channelTag = 'Allgemein';

  /** Close-Button geklickt - Parent kann das Panel damit ausblenden. */
  readonly closed = output<void>();

  protected onClose(): void {
    this.closed.emit();
  }
}
