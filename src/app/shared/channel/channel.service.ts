import { inject, Injectable } from '@angular/core';
import { arrayRemove, collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { FIRESTORE } from '../firebase/firebase.tokens';
import { Channel } from '../models';

/** Zugriff auf die Firestore-Collection `channels`. */
@Injectable({ providedIn: 'root' })
export class ChannelService {
  private readonly firestore = inject(FIRESTORE);

  /** Legt einen neuen Channel an (Auto-ID) und liefert dessen ID. */
  async createChannel(name: string, description: string, createdBy: string): Promise<string> {
    const channels = collection(this.firestore, 'channels');
    const ref = doc(channels);
    const channel: Channel = {
      id: ref.id,
      name,
      description,
      memberIds: [createdBy],
      createdBy,
      createdAt: Date.now(),
    };
    await setDoc(ref, channel);
    return channel.id;
  }

  /** Ueberschreibt die Mitgliederliste eines bestehenden Channels. */
  async setMembers(channelId: string, memberIds: string[]): Promise<void> {
    const ref = doc(this.firestore, 'channels', channelId);
    await updateDoc(ref, { memberIds });
  }

  /** Liefert ein einzelnes Channel-Dokument, oder null falls es nicht existiert. */
  async getChannel(channelId: string): Promise<Channel | null> {
    const snapshot = await getDoc(doc(this.firestore, 'channels', channelId));
    return snapshot.exists() ? (snapshot.data() as Channel) : null;
  }

  /** Aktualisiert Name/Beschreibung (Channel-Verwaltungs-Dialog, nur Ersteller). */
  async updateChannel(
    channelId: string,
    changes: Partial<Pick<Channel, 'name' | 'description'>>,
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'channels', channelId), changes);
  }

  /** Entfernt die eigene uid aus memberIds ("Channel verlassen"). */
  async leaveChannel(channelId: string, uid: string): Promise<void> {
    await updateDoc(doc(this.firestore, 'channels', channelId), { memberIds: arrayRemove(uid) });
  }
}
