import { inject, Injectable, signal } from '@angular/core';
import { Message, Reaction } from '../../../shared/models';
import { FIREBASE_AUTH } from '../../../shared/firebase/firebase.tokens';
import { MessageService } from '../../../shared/message/message';
import { MAIN_CHAT_EMOJIS } from './main-chat-emojis';

/** Zusammenfassung einer Reaction fuer die Anzeige. */
export type ReactionGroup = {
  emoji: string;
  count: number;
};

/** Verwaltet Reactions innerhalb des Main-Chats. */
@Injectable()
export class MainChatReactionService {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly messageService = inject(MessageService);

  readonly activeReactionMessageId = signal<string | null>(null);
  readonly expandedReactionMessageIds = signal<Set<string>>(new Set());

  readonly reactionOptions = MAIN_CHAT_EMOJIS;

  /** Liefert die aktuell sichtbaren Reactions einer Nachricht. */
  getReactionGroups(message: Message): ReactionGroup[] {
    const groups = this.createSortedReactionGroups(message);
    const limit = this.getReactionLimit(message.id);

    return groups.slice(0, limit);
  }

  /** Liefert die Anzahl aktuell ausgeblendeter Reactions. */
  getHiddenReactionCount(message: Message): number {
    const groups = this.createSortedReactionGroups(message);
    const limit = this.getReactionLimit(message.id);

    return Math.max(groups.length - limit, 0);
  }

  /** Prueft, ob die Reaction-Liste erweitert ist. */
  isExpanded(messageId: string): boolean {
    return this.expandedReactionMessageIds().has(messageId);
  }

  /** Oeffnet oder reduziert die Reaction-Liste. */
  toggleExpanded(messageId: string): void {
    this.expandedReactionMessageIds.update(
      (current) => this.toggleExpandedId(current, messageId),
    );
  }

  /** Aktualisiert den Expand-Status einer Nachricht. */
  private toggleExpandedId(
    current: Set<string>,
    messageId: string,
  ): Set<string> {
    const next = new Set(current);

    next.has(messageId)
      ? next.delete(messageId)
      : next.add(messageId);

    return next;
  }

  /** Liefert das aktuelle Reaction-Limit. */
  private getReactionLimit(messageId: string): number {
    return this.isExpanded(messageId) ? 20 : 6;
  }

  /** Erstellt gruppierte und sortierte Reactions. */
  private createSortedReactionGroups(
    message: Message,
  ): ReactionGroup[] {
    const counts = this.countReactions(message);

    return [...counts]
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count);
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

  /** Oeffnet oder schliesst die Emoji-Auswahl. */
  toggleReactionPicker(messageId: string): void {
    const current = this.activeReactionMessageId();

    this.activeReactionMessageId.set(
      current === messageId ? null : messageId,
    );
  }

  /** Fuegt eine Reaction hinzu oder entfernt sie. */
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

    await this.updateReaction(message, reaction, channelId);
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

    await this.addReaction(channelId, message.id, reaction);
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