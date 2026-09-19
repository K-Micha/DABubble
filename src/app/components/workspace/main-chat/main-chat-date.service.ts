import { Injectable } from '@angular/core';
import { Message } from '../../../shared/models';

/** Verwaltet Datumslogik fuer Nachrichten im Main-Chat. */
@Injectable()
export class MainChatDateService {
  /** Prueft, ob vor einer Nachricht ein Datumstrenner erscheint. */
  showDateSeparator(
    messages: Message[],
    index: number,
  ): boolean {
    if (index === 0) return true;

    const current = new Date(messages[index].timestamp);
    const previous = new Date(messages[index - 1].timestamp);

    return !this.isSameDay(current, previous);
  }

  /** Formatiert das Datum eines Nachrichtentrenners. */
  formatDateSeparator(timestamp: number): string {
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

  /** Formatiert ein aelteres Datum fuer die Anzeige. */
  private formatFullDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  }
}