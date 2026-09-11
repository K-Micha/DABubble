import { inject, Injectable } from '@angular/core';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
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
}
