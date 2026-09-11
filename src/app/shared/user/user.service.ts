import { inject, Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { FIRESTORE } from '../firebase/firebase.tokens';
import { User } from '../models';

/** Zugriff auf die Firestore-Collection `users`. */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly firestore = inject(FIRESTORE);

  /** Legt das User-Dokument an, falls es noch nicht existiert (Doc-ID = User-ID). */
  async ensureProfile(user: User): Promise<void> {
    const ref = doc(this.firestore, 'users', user.id);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      await setDoc(ref, user);
    }
  }

  /** Liefert alle registrierten User (z. B. fuer die Mitglieder-Auswahl im Channel-Dialog). */
  async listUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(this.firestore, 'users'));
    return snapshot.docs.map((entry) => entry.data() as User);
  }

  /** Liefert ein einzelnes User-Dokument, oder null falls es (noch) nicht existiert. */
  async getUser(uid: string): Promise<User | null> {
    const snapshot = await getDoc(doc(this.firestore, 'users', uid));
    return snapshot.exists() ? (snapshot.data() as User) : null;
  }

  /** Aktualisiert Name/Avatar im bestehenden User-Dokument (Profil-bearbeiten-Dialog). */
  async updateProfile(
    uid: string,
    changes: Partial<Pick<User, 'name' | 'avatarUrl'>>,
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'users', uid), changes);
  }
}
