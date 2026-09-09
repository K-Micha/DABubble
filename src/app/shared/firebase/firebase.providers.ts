import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { FIREBASE_APP, FIREBASE_AUTH, FIRESTORE } from './firebase.tokens';

/**
 * Initialisiert Firebase einmalig und stellt App, Auth und Firestore per DI
 * bereit. In app.config.ts einbinden: `provideFirebase()`.
 * Services injizieren die Instanzen ueber FIREBASE_AUTH / FIRESTORE.
 */
export function provideFirebase(): EnvironmentProviders {
  const app = initializeApp(environment.firebase);

  return makeEnvironmentProviders([
    { provide: FIREBASE_APP, useValue: app },
    { provide: FIREBASE_AUTH, useValue: getAuth(app) },
    { provide: FIRESTORE, useValue: getFirestore(app) },
  ]);
}
