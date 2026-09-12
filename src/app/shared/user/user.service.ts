import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { FIRESTORE } from '../firebase/firebase.tokens';
import { User } from '../models';

/** Verwaltet User-Profile und sichtbare User-Listen in Firestore. */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly firestore = inject(FIRESTORE);

  /** Legt ein normales User-Profil an, falls es noch nicht existiert. */
  async ensureProfile(user: User): Promise<void> {
    const ref = doc(this.firestore, 'users', user.id);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      await setDoc(ref, user);
    }
  }

  /** Liefert alle gespeicherten User. */
  async listUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(this.firestore, 'users'));
    return snapshot.docs.map((entry) => entry.data() as User);
  }

  /** Liefert fuer Gaeste nur Demo-User, sonst die normale User-Liste. */
  async listVisibleUsers(isGuest: boolean): Promise<User[]> {
    const users = await this.listUsers();

    if (isGuest) {
      return users.filter((user) => user.isDemo === true);
    }

    return users;
  }

  /** Liefert ein einzelnes User-Profil oder null. */
  async getUser(uid: string): Promise<User | null> {
    const snapshot = await getDoc(doc(this.firestore, 'users', uid));
    return snapshot.exists() ? (snapshot.data() as User) : null;
  }

  /** Aktualisiert Name oder Avatar eines bestehenden Profils. */
  async updateProfile(
    uid: string,
    changes: Partial<Pick<User, 'name' | 'avatarUrl'>>,
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', uid), changes);
  }
}