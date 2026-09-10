import { inject, Injectable } from '@angular/core';
import { doc, setDoc } from 'firebase/firestore';
import { FIRESTORE } from '../firebase/firebase.tokens';
import { User } from '../models';

/** Zugriff auf die Firestore-Collection `users`. */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly firestore = inject(FIRESTORE);

  /** Schreibt das User-Dokument (Doc-ID = User-ID). */
  async createProfile(user: User): Promise<void> {
    await setDoc(doc(this.firestore, 'users', user.id), user);
  }
}
