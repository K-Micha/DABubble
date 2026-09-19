/**
 * ENTWURF Firestore-Datenmodell.
 */

export type OnlineStatus =
  | 'online'
  | 'away'
  | 'offline';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  onlineStatus: OnlineStatus;
  isDemo?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  createdBy: string;
  createdAt: number;
  guestVisible?: boolean;
}

export interface DirectChat {
  id: string;
  memberIds: string[];
  createdAt: number;
}

export interface Reaction {
  emoji: string;
  userId: string;
  messageId: string;
}

export interface Message {
  id: string;
  channelId?: string;
  dmId?: string;
  senderId: string;
  text: string;
  timestamp: number;
  reactions: Reaction[];
  threadId?: string;
  attachmentPath?: string;
  attachmentName?: string;
}

export interface Thread {
  id: string;
  parentMessageId: string;
  replies: Message[];
}