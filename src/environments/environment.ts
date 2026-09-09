/**
 * Produktions-Umgebung (Default-Build).
 * Die Firebase-Web-Config ist kein Secret – sie wird ohnehin an den Client
 * ausgeliefert. Trotzdem: vor dem ersten echten Deploy hier die Werte aus der
 * Firebase Console (Projekteinstellungen -> Allgemein -> Deine Apps) eintragen.
 */
export const environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyD34QWiFOnSLhhmEzk5wE_nh6g5Y1HhG2Y',
    authDomain: 'dababble.firebaseapp.com',
    projectId: 'dababble',
    storageBucket: 'dababble.firebasestorage.app',
    messagingSenderId: '946133175704',
    appId: '1:946133175704:web:4ac61b4c6a97ae1d4a6fed',
  },
    supabase: {
    url: 'https://hpyyktoyofffpfunjgna.supabase.co',
    anonKey: 'DEIN_SUPABASE_ANON_KEY',
  },
};