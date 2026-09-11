import { inject, Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
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
}
