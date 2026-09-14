import { inject, Injectable, signal } from '@angular/core';
import { Message, User } from '../../../shared/models';
import { UserService } from '../../../shared/user/user.service';

/** Verwaltet Absenderprofile und deren Darstellung im Main-Chat. */
@Injectable()
export class MainChatProfileService {
  private readonly userService = inject(UserService);

  private readonly senderProfiles =
    signal<Record<string, User | null>>({});

  /** Laedt noch unbekannte Absenderprofile einer Nachrichtenliste. */
  async loadSenderProfiles(messages: Message[]): Promise<void> {
    const senderIds = this.getUnknownSenderIds(messages);

    await Promise.all(
      senderIds.map((senderId) => this.loadSenderProfile(senderId)),
    );
  }

  /** Liefert Absender, deren Profil noch nicht geladen wurde. */
  private getUnknownSenderIds(messages: Message[]): string[] {
    const profiles = this.senderProfiles();

    return [...new Set(messages.map((message) => message.senderId))]
      .filter((senderId) => !(senderId in profiles));
  }

  /** Laedt ein einzelnes Absenderprofil aus Firestore. */
  private async loadSenderProfile(senderId: string): Promise<void> {
    const profile = await this.userService.getUser(senderId);

    this.senderProfiles.update((profiles) => ({
      ...profiles,
      [senderId]: profile,
    }));
  }

  /** Liefert den Anzeigenamen eines Nachrichtenabsenders. */
  getSenderName(senderId: string): string {
    return this.senderProfiles()[senderId]?.name ?? 'Gast';
  }

  /** Liefert das Avatar eines Nachrichtenabsenders. */
  getSenderAvatar(senderId: string): string {
    return this.senderProfiles()[senderId]?.avatarUrl
      ?? 'img/avatar/profile_blank.svg';
  }

  /** Formatiert einen Nachrichtenzeitpunkt als Uhrzeit. */
  formatMessageTime(timestamp: number): string {
    const time = new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);

    return `${time} Uhr`;
  }
}