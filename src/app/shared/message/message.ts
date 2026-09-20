import { inject, Injectable } from '@angular/core';
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import { FIRESTORE } from '../firebase/firebase.tokens';
import { DirectChat, Message, Reaction } from '../models';

/** Zugriff auf Direktchats und Nachrichten in Firestore. */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly firestore = inject(FIRESTORE);

  /** Liefert einen bestehenden Direktchat oder legt einen neuen an. */
  async getOrCreateDirectChat(userIdA: string, userIdB: string): Promise<string> {
    const directChats = collection(this.firestore, 'directChats');

    const existingChat = await this.findDirectChat(directChats, userIdA, userIdB);

    if (existingChat) return existingChat.id;

    return this.createDirectChat(directChats, userIdA, userIdB);
  }

  /** Sucht einen bestehenden Direktchat zwischen zwei Usern. */
  private async findDirectChat(
    directChats: ReturnType<typeof collection>,
    userIdA: string,
    userIdB: string,
  ) {
    const directChatQuery = query(directChats, where('memberIds', 'array-contains', userIdA));

    const snapshot = await getDocs(directChatQuery);

    return snapshot.docs.find((entry) => {
      const chat = entry.data() as DirectChat;

      return chat.memberIds.includes(userIdB);
    });
  }

  /** Legt einen neuen Direktchat zwischen zwei Usern an. */
  private async createDirectChat(
    directChats: ReturnType<typeof collection>,
    userIdA: string,
    userIdB: string,
  ): Promise<string> {
    const ref = doc(directChats);

    const chat = this.createDirectChatData(ref.id, userIdA, userIdB);

    await setDoc(ref, chat);

    return chat.id;
  }

  /** Erstellt die Daten fuer einen neuen Direktchat. */
  private createDirectChatData(id: string, userIdA: string, userIdB: string): DirectChat {
    return {
      id,
      memberIds: [userIdA, userIdB],
      createdAt: Date.now(),
    };
  }

  /** Beobachtet Channel-Nachrichten in Echtzeit. */
  subscribeChannelMessages(
    channelId: string,
    callback: (messages: Message[]) => void,
  ): Unsubscribe {
    const messages = this.createChannelMessagesCollection(channelId);

    return this.subscribeMessages(messages, callback);
  }

  /** Beobachtet Direktnachrichten in Echtzeit. */
  subscribeDirectMessages(dmId: string, callback: (messages: Message[]) => void): Unsubscribe {
    const messages = this.createDirectMessagesCollection(dmId);

    return this.subscribeMessages(messages, callback);
  }

  /** Beobachtet eine Nachrichten-Collection nach Zeit sortiert. */
  private subscribeMessages(
    messages: ReturnType<typeof collection>,
    callback: (messages: Message[]) => void,
  ): Unsubscribe {
    const messageQuery = query(messages, orderBy('timestamp', 'asc'));

    return onSnapshot(messageQuery, (snapshot) => {
      callback(snapshot.docs.map((entry) => entry.data() as Message));
    });
  }

  /** Liefert die Nachrichten-Collection eines Channels. */
  private createChannelMessagesCollection(channelId: string) {
    return collection(this.firestore, 'channels', channelId, 'messages');
  }

  /** Liefert die Nachrichten-Collection eines Direktchats. */
  private createDirectMessagesCollection(dmId: string) {
    return collection(this.firestore, 'directChats', dmId, 'messages');
  }

  /** Speichert eine Nachricht innerhalb eines Channels. */
  async sendChannelMessage(
    channelId: string,
    senderId: string,
    text: string,
    attachmentPath?: string,
    attachmentName?: string,
  ): Promise<string> {
    const ref = doc(this.createChannelMessagesCollection(channelId));

    const message = this.createChannelMessage(ref.id, channelId, senderId, text);

    this.addAttachmentData(message, attachmentPath, attachmentName);

    await setDoc(ref, message);

    return message.id;
  }

  /** Speichert eine Nachricht innerhalb eines Direktchats. */
  async sendDirectMessage(
    dmId: string,
    senderId: string,
    text: string,
    attachmentPath?: string,
    attachmentName?: string,
  ): Promise<string> {
    const ref = doc(this.createDirectMessagesCollection(dmId));

    const message = this.createDirectMessage(ref.id, dmId, senderId, text);

    this.addAttachmentData(message, attachmentPath, attachmentName);

    await setDoc(ref, message);

    return message.id;
  }

  /** Fuegt einer Channel-Nachricht eine Reaction hinzu. */
  async addChannelReaction(
    channelId: string,
    messageId: string,
    reaction: Reaction,
  ): Promise<void> {
    const ref = this.createChannelMessageDoc(channelId, messageId);

    await updateDoc(ref, {
      reactions: arrayUnion(reaction),
    });
  }

  /** Entfernt eine Reaction von einer Channel-Nachricht. */
  async removeChannelReaction(
    channelId: string,
    messageId: string,
    reaction: Reaction,
  ): Promise<void> {
    const ref = this.createChannelMessageDoc(channelId, messageId);

    await updateDoc(ref, {
      reactions: arrayRemove(reaction),
    });
  }

  /** Fuegt einer Direktnachricht eine Reaction hinzu. */
  async addDirectReaction(dmId: string, messageId: string, reaction: Reaction): Promise<void> {
    const ref = this.createDirectMessageDoc(dmId, messageId);

    await updateDoc(ref, {
      reactions: arrayUnion(reaction),
    });
  }

  /** Entfernt eine Reaction von einer Direktnachricht. */
  async removeDirectReaction(dmId: string, messageId: string, reaction: Reaction): Promise<void> {
    const ref = this.createDirectMessageDoc(dmId, messageId);

    await updateDoc(ref, {
      reactions: arrayRemove(reaction),
    });
  }

  /** Liefert eine vorhandene Channel-Nachricht. */
  private createChannelMessageDoc(channelId: string, messageId: string) {
    return doc(this.firestore, 'channels', channelId, 'messages', messageId);
  }

  /** Liefert eine vorhandene Direktnachricht. */
  private createDirectMessageDoc(dmId: string, messageId: string) {
    return doc(this.firestore, 'directChats', dmId, 'messages', messageId);
  }

  /** Erstellt das Grundobjekt einer Channel-Nachricht. */
  private createChannelMessage(
    id: string,
    channelId: string,
    senderId: string,
    text: string,
  ): Message {
    return {
      id,
      channelId,
      senderId,
      text,
      timestamp: Date.now(),
      reactions: [],
    };
  }

  /** Erstellt das Grundobjekt einer Direktnachricht. */
  private createDirectMessage(id: string, dmId: string, senderId: string, text: string): Message {
    return {
      id,
      dmId,
      senderId,
      text,
      timestamp: Date.now(),
      reactions: [],
    };
  }

  /** Fuegt einer Nachricht vorhandene Anhangsdaten hinzu. */
  private addAttachmentData(
    message: Message,
    attachmentPath?: string,
    attachmentName?: string,
  ): void {
    if (attachmentPath) {
      message.attachmentPath = attachmentPath;
    }

    if (attachmentName) {
      message.attachmentName = attachmentName;
    }
  }

  /** Beobachtet die Antworten eines Threads in Echtzeit. */
  subscribeThreadReplies(
    parentMessage: Message,
    callback: (replies: Message[]) => void,
  ): Unsubscribe {
    const replies = this.createThreadRepliesCollection(parentMessage);

    return this.subscribeMessages(replies, callback);
  }

  /** Liefert die Antworten-Collection einer Channel- oder Direktnachricht. */
  private createThreadRepliesCollection(parentMessage: Message) {
    if (parentMessage.channelId) {
      return collection(
        this.firestore,
        'channels',
        parentMessage.channelId,
        'messages',
        parentMessage.id,
        'replies',
      );
    }

    return collection(
      this.firestore,
      'directChats',
      parentMessage.dmId ?? '',
      'messages',
      parentMessage.id,
      'replies',
    );
  }

  /** Speichert eine Antwort innerhalb eines Threads. */
  async sendThreadReply(
    parentMessage: Message,
    senderId: string,
    text: string,
    attachmentPath?: string,
    attachmentName?: string,
  ): Promise<string> {
    const replies = this.createThreadRepliesCollection(parentMessage);

    const ref = doc(replies);
    const reply = this.createThreadReply(ref.id, parentMessage, senderId, text);

    this.addAttachmentData(reply, attachmentPath, attachmentName);

    await setDoc(ref, reply);
    return reply.id;
  }

  /** Erstellt das Grundobjekt einer Thread-Antwort. */
  private createThreadReply(
    id: string,
    parentMessage: Message,
    senderId: string,
    text: string,
  ): Message {
    const reply: Message = {
      id,
      threadId: parentMessage.id,
      senderId,
      text,
      timestamp: Date.now(),
      reactions: [],
    };

    // Firestore lehnt explizite `undefined`-Werte ab - nur das jeweils
    // vorhandene Feld setzen (Channel- oder Direktchat-Nachricht).
    if (parentMessage.channelId) reply.channelId = parentMessage.channelId;
    if (parentMessage.dmId) reply.dmId = parentMessage.dmId;

    return reply;
  }

  /** Fuegt einer Thread-Antwort eine Reaction hinzu. */
  async addReplyReaction(
    parentMessage: Message,
    replyId: string,
    reaction: Reaction,
  ): Promise<void> {
    const ref = this.createThreadReplyDoc(parentMessage, replyId);

    await updateDoc(ref, {
      reactions: arrayUnion(reaction),
    });
  }

  /** Entfernt eine Reaction von einer Thread-Antwort. */
  async removeReplyReaction(
    parentMessage: Message,
    replyId: string,
    reaction: Reaction,
  ): Promise<void> {
    const ref = this.createThreadReplyDoc(parentMessage, replyId);

    await updateDoc(ref, {
      reactions: arrayRemove(reaction),
    });
  }

  /** Liefert die Referenz zu einer vorhandenen Thread-Antwort. */
  private createThreadReplyDoc(parentMessage: Message, replyId: string) {
    return doc(this.createThreadRepliesCollection(parentMessage), replyId);
  }
}
