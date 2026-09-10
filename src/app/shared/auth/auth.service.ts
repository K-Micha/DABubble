import { inject, Injectable } from '@angular/core';
import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { FIREBASE_AUTH } from '../firebase/firebase.tokens';

/** Deutsche, feldnahe Fehlermeldungen je Firebase-Auth-Fehlercode (DoD: keine Alerts). */
const AUTH_ERROR_MESSAGES: Record<string, string | undefined> = {
  'auth/invalid-email': 'Diese E-Mail-Adresse ist leider ungültig.',
  'auth/invalid-credential': 'E-Mail oder Passwort ist falsch.',
  'auth/user-not-found': 'E-Mail oder Passwort ist falsch.',
  'auth/wrong-password': 'E-Mail oder Passwort ist falsch.',
  'auth/user-disabled': 'Dieses Konto wurde deaktiviert.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte versuche es später erneut.',
  'auth/network-request-failed': 'Netzwerkfehler. Bitte prüfe deine Internetverbindung.',
  'auth/popup-closed-by-user': 'Anmeldung abgebrochen.',
  'auth/popup-blocked': 'Das Anmelde-Popup wurde blockiert. Bitte erlaube Popups.',
};

const FALLBACK_MESSAGE = 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(FIREBASE_AUTH);

  async loginWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async loginWithGoogle(): Promise<void> {
    await signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  async loginAsGuest(): Promise<void> {
    await signInAnonymously(this.auth);
  }

  toMessage(error: unknown): string {
    const code = error instanceof FirebaseError ? error.code : '';
    return AUTH_ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE;
  }
}
