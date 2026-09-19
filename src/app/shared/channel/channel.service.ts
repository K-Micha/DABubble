import { inject, Injectable } from '@angular/core';
import {
  arrayRemove,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { FIRESTORE } from '../firebase/firebase.tokens';
import { Channel } from '../models';

const PINNED_CHANNELS = [
  'Entwicklerteam',
  'Office-Team',
];

const AUTHENTICATED_CHANNEL = 'Office-Team';

/** Zugriff auf die Firestore-Collection `channels`. */
@Injectable({ providedIn: 'root' })
export class ChannelService {
  private readonly firestore = inject(FIRESTORE);

  /** Legt einen neuen Channel an und traegt den Ersteller direkt als Mitglied ein. */
  async createChannel(
    name: string,
    description: string,
    createdBy: string,
  ): Promise<string> {
    const channels = collection(this.firestore, 'channels');
    const ref = doc(channels);

    const channel: Channel = {
      id: ref.id,
      name,
      description,
      memberIds: [createdBy],
      createdBy,
      createdAt: Date.now(),
      guestVisible: false,
    };

    await setDoc(ref, channel);

    return channel.id;
  }

  /** Liefert alle Channels mit festen Channels an erster Stelle. */
  async listChannels(): Promise<Channel[]> {
    const snapshot =
      await getDocs(collection(this.firestore, 'channels'));

    const channels =
      snapshot.docs.map(
        (entry) => entry.data() as Channel,
      );

    return this.sortChannels(channels);
  }

  /** Liefert nur die fuer den aktuellen User sichtbaren Channels. */
  async listVisibleChannels(
    currentUid: string | null,
    isGuest: boolean,
  ): Promise<Channel[]> {
    const channels = await this.listChannels();

    return channels.filter(
      (channel) =>
        this.isChannelVisible(
          channel,
          currentUid,
          isGuest,
        ),
    );
  }

  /** Prueft die Sichtbarkeit eines Channels fuer den aktuellen User. */
  private isChannelVisible(
    channel: Channel,
    currentUid: string | null,
    isGuest: boolean,
  ): boolean {
    if (channel.guestVisible === true) return true;
    if (!currentUid || isGuest) return false;

    if (channel.name === AUTHENTICATED_CHANNEL) {
      return true;
    }

    return channel.memberIds.includes(currentUid);
  }

  /** Sortiert feste Channels vor alle normalen Channels. */
  private sortChannels(channels: Channel[]): Channel[] {
    return [...channels].sort(
      (a, b) =>
        this.getChannelPosition(a)
        - this.getChannelPosition(b),
    );
  }

  /** Liefert die feste Position eines Channels. */
  private getChannelPosition(channel: Channel): number {
    const index =
      PINNED_CHANNELS.indexOf(channel.name);

    return index === -1
      ? PINNED_CHANNELS.length
      : index;
  }

  /** Ueberschreibt die Mitgliederliste eines bestehenden Channels. */
  async setMembers(
    channelId: string,
    memberIds: string[],
  ): Promise<void> {
    const ref =
      doc(this.firestore, 'channels', channelId);

    await updateDoc(ref, { memberIds });
  }

  /** Liefert ein einzelnes Channel-Dokument oder null. */
  async getChannel(
    channelId: string,
  ): Promise<Channel | null> {
    const snapshot =
      await getDoc(
        doc(this.firestore, 'channels', channelId),
      );

    return snapshot.exists()
      ? snapshot.data() as Channel
      : null;
  }

  /** Aktualisiert Name oder Beschreibung eines Channels. */
  async updateChannel(
    channelId: string,
    changes: Partial<
      Pick<Channel, 'name' | 'description'>
    >,
  ): Promise<void> {
    await updateDoc(
      doc(this.firestore, 'channels', channelId),
      changes,
    );
  }

  /** Entfernt die eigene UID aus memberIds. */
  async leaveChannel(
    channelId: string,
    uid: string,
  ): Promise<void> {
    await updateDoc(
      doc(this.firestore, 'channels', channelId),
      {
        memberIds: arrayRemove(uid),
      },
    );
  }
}