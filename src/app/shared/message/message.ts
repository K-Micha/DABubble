import { inject, Injectable } from '@angular/core';
import { collection, doc, getDocs, query, setDoc, where, } from 'firebase/firestore';
import { FIRESTORE } from '../firebase/firebase.tokens';
import { DirectChat, Message } from '../models';

/** Zugriff auf Direktchats und Nachrichten in Firestore. */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly firestore = inject(FIRESTORE);

  /** Liefert einen bestehenden Direktchat oder legt einen neuen an. */
  async getOrCreateDirectChat(
    userIdA: string,
    userIdB: string,): Promise<string> {
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
    const directChatQuery = query(
      directChats, where('memberIds', 'array-contains', userIdA),
    );

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
    userIdB: string,): Promise<string> {
    const ref = doc(directChats);
    const chat = this.createDirectChatData(ref.id, userIdA, userIdB);

    await setDoc(ref, chat);

    return chat.id;
  }

  /** Erstellt die Daten fuer einen neuen Direktchat. */
  private createDirectChatData(
    id: string,
    userIdA: string,
    userIdB: string,): DirectChat {
    return {
      id,
      memberIds: [userIdA, userIdB],
      createdAt: Date.now(),
    };
  }

  /** Speichert eine Nachricht innerhalb eines Channels. */
  async sendChannelMessage(
    channelId: string,
    senderId: string,
    text: string,
    attachmentPath?: string,
    attachmentName?: string,): Promise<string> {
    const ref = this.createChannelMessageRef(channelId);
    const message = this.createChannelMessage(ref.id, channelId, senderId, text);

    this.addAttachmentData(message, attachmentPath, attachmentName);

    await setDoc(ref, message);
    return message.id;
  }

  /** Erstellt eine neue Nachrichten-Referenz fuer einen Channel. */
  private createChannelMessageRef(channelId: string) {
    const messages = collection(
      this.firestore,
      'channels', channelId, 'messages',
    );

    return doc(messages);
  }

  /** Erstellt das Grundobjekt einer Channel-Nachricht. */
  private createChannelMessage(
    id: string,
    channelId: string,
    senderId: string,
    text: string,): Message {
    return {
      id,
      channelId,
      senderId,
      text,
      timestamp: Date.now(),
      reactions: [],
    };
  }

  /** Speichert eine Nachricht innerhalb eines Direktchats. */
  async sendDirectMessage(
    dmId: string,
    senderId: string,
    text: string,
    attachmentPath?: string,
    attachmentName?: string): Promise<string> {
    const ref = this.createDirectMessageRef(dmId);
    const message = this.createDirectMessage(ref.id, dmId, senderId, text);

    this.addAttachmentData(message, attachmentPath, attachmentName);

    await setDoc(ref, message);
    return message.id;
  }

  /** Erstellt eine neue Nachrichten-Referenz fuer einen Direktchat. */
  private createDirectMessageRef(dmId: string) {
    const messages = collection(
      this.firestore, 'directChats', dmId, 'messages',
    );

    return doc(messages);
  }

  /** Erstellt das Grundobjekt einer Direktnachricht. */
  private createDirectMessage(
    id: string,
    dmId: string,
    senderId: string,
    text: string,
  ): Message {
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
    attachmentName?: string,): void {
    if (attachmentPath) message.attachmentPath = attachmentPath;
    if (attachmentName) message.attachmentName = attachmentName;
  }
}