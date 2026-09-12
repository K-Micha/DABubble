import { inject, Injectable } from '@angular/core';
import { FirebaseError } from 'firebase/app';
import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { FIREBASE_AUTH } from '../firebase/firebase.tokens';
import { User } from '../models';
import { UserService } from '../user/user.service';

/** Deutsche Fehlermeldungen fuer bekannte Firebase-Auth-Fehler. */
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
  'auth/email-already-in-use': 'Diese E-Mail-Adresse wird bereits verwendet.',
  'auth/weak-password': 'Das Passwort ist zu schwach. Bitte wähle mindestens 6 Zeichen.',
  'auth/operation-not-allowed': 'Diese Anmeldemethode ist nicht aktiviert.',
  'auth/expired-action-code': 'Dieser Link ist abgelaufen. Bitte fordere einen neuen Link an.',
  'auth/invalid-action-code': 'Dieser Link ist ungültig oder wurde bereits verwendet.',
  'permission-denied': 'Speichern nicht erlaubt. Bitte prüfe die Firestore-Regeln.',
  unavailable: 'Dienst nicht erreichbar. Bitte versuche es später erneut.',
};

const FALLBACK_MESSAGE = 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.';

/** Verwaltet Registrierung, Login und Passwort-Reset ueber Firebase Auth. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly userService = inject(UserService);

  /** Meldet einen bestehenden User mit E-Mail und Passwort an. */
  async loginWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  /** Meldet einen Google-User an und stellt dessen Firestore-Profil sicher. */
  async loginWithGoogle(): Promise<void> {
    const { user } = await signInWithPopup(this.auth, new GoogleAuthProvider());
    await this.userService.ensureProfile(this.toProfile(user));
  }

  /** Meldet einen anonymen Gast an, ohne ein User-Profil anzulegen. */
  async loginAsGuest(): Promise<void> {
    await signInAnonymously(this.auth);
  }

  /** Erstellt aus einem Firebase-User ein normales Firestore-Profil. */
  private toProfile(user: FirebaseUser): User {
    return {
      id: user.uid,
      name: user.displayName ?? 'Nutzer',
      email: user.email ?? '',
      avatarUrl: user.photoURL ?? 'img/avatar/avatar01.svg',
      onlineStatus: 'online',
    };
  }

  /** Erstellt einen Account und liefert dessen neue User-ID zurueck. */
  async registerWithEmail(
    name: string,
    email: string,
    password: string,
  ): Promise<string> {
    const credential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password,
    );

    await updateProfile(credential.user, { displayName: name });
    return credential.user.uid;
  }

  /** Verschickt eine Passwort-Reset-Mail ohne User-Enumeration. */
  async sendResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'auth/user-not-found') return;
      throw error;
    }
  }

  /** Setzt das Passwort ueber den Code aus der Reset-Mail neu. */
  async confirmReset(oobCode: string, newPassword: string): Promise<void> {
    try {
      await confirmPasswordReset(this.auth, oobCode, newPassword);
    } catch (error) {
      throw new Error(this.toMessage(error));
    }
  }

  /** Uebersetzt Firebase-Fehler in eine passende Benutzer-Meldung. */
  toMessage(error: unknown): string {
    const code = error instanceof FirebaseError ? error.code : '';
    return AUTH_ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE;
  }
}