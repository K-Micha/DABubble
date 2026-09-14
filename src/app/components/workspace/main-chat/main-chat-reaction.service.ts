import { inject, Injectable, signal } from '@angular/core';
import { Message, Reaction } from '../../../shared/models';
import { FIREBASE_AUTH } from '../../../shared/firebase/firebase.tokens';
import { MessageService } from '../../../shared/message/message';
import { MAIN_CHAT_EMOJIS } from './main-chat-emojis';

/** Zusammenfassung einer Reaction fuer die Anzeige. */
export type ReactionGroup = {
  emoji: string;
  count: number;
  overflow?: boolean;
};

/** Verwaltet Reactions innerhalb des Main-Chats. */
@Injectable()
export class MainChatReactionService {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly messageService = inject(MessageService);

  readonly activeReactionMessageId = signal<string | null>(null);

  readonly reactionOptions = MAIN_CHAT_EMOJIS;

  /** Liefert sechs Reactions und optional einen Ueberlauf. */
  getReactionGroups(message: Message): ReactionGroup[] {
    const groups = this.createSortedReactionGroups(message);

    if (groups.length <= 6) return groups;

    return [
      ...groups.slice(0, 6),
      this.createOverflowGroup(groups.length),
    ];
  }

  /** Erstellt gruppierte und nach Anzahl sortierte Reactions. */
  private createSortedReactionGroups(
    message: Message,
  ): ReactionGroup[] {
    const counts = this.countReactions(message);

    return [...counts]
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count);
  }

  /** Erstellt den Hinweis fuer weitere Reaction-Typen. */
  private createOverflowGroup(totalGroups: number): ReactionGroup {
    return {
      emoji: '',
      count: totalGroups - 6,
      overflow: true,
    };
  }

  /** Zaehlt gleiche Reactions einer Nachricht. */
  private countReactions(message: Message): Map<string, number> {
    const counts = new Map<string, number>();

    for (const reaction of message.reactions ?? []) {
      const count = counts.get(reaction.emoji) ?? 0;
      counts.set(reaction.emoji, count + 1);
    }

    return counts;
  }

  /** Oeffnet oder schliesst die Emoji-Auswahl einer Nachricht. */
  toggleReactionPicker(messageId: string): void {
    const current = this.activeReactionMessageId();

    this.activeReactionMessageId.set(
      current === messageId ? null : messageId,
    );
  }

  /** Fuegt eine Reaction hinzu oder entfernt die eigene vorhandene. */
  async toggleReaction(
    message: Message,
    emoji: string,
    channelId: string | null,
  ): Promise<void> {
    const userId = this.auth.currentUser?.uid;

    if (!userId || !channelId) return;

    const reaction = this.createReaction(
      message.id,
      userId,
      emoji,
    );

    await this.updateReaction(
      message,
      reaction,
      channelId,
    );

    this.activeReactionMessageId.set(null);
  }

  /** Erstellt eine Reaction fuer eine Nachricht. */
  private createReaction(
    messageId: string,
    userId: string,
    emoji: string,
  ): Reaction {
    return {
      emoji,
      userId,
      messageId,
    };
  }

  /** Fuegt eine Reaction hinzu oder entfernt sie wieder. */
  private async updateReaction(
    message: Message,
    reaction: Reaction,
    channelId: string,
  ): Promise<void> {
    if (this.hasReaction(message, reaction)) {
      await this.removeReaction(
        channelId,
        message.id,
        reaction,
      );

      return;
    }

    await this.addReaction(
      channelId,
      message.id,
      reaction,
    );
  }

  /** Prueft, ob der User dieselbe Reaction bereits gesetzt hat. */
  private hasReaction(
    message: Message,
    reaction: Reaction,
  ): boolean {
    return message.reactions.some(
      (entry) =>
        entry.userId === reaction.userId
        && entry.emoji === reaction.emoji,
    );
  }

  /** Fuegt eine Reaction in Firestore hinzu. */
  private async addReaction(
    channelId: string,
    messageId: string,
    reaction: Reaction,
  ): Promise<void> {
    await this.messageService.addChannelReaction(
      channelId,
      messageId,
      reaction,
    );
  }

  /** Entfernt eine Reaction aus Firestore. */
  private async removeReaction(
    channelId: string,
    messageId: string,
    reaction: Reaction,
  ): Promise<void> {
    await this.messageService.removeChannelReaction(
      channelId,
      messageId,
      reaction,
    );
  }
}