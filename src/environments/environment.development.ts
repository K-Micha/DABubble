/**
 * Entwicklungs-Umgebung (`ng serve`).
 * Wird per fileReplacements in angular.json gegen environment.ts getauscht.
 * Fuer lokale Entwicklung koennen hier spaeter die Firebase-Emulator-Ports
 * ergaenzt werden.
 */
export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyD34QWiFOnSLhhmEzk5wE_nh6g5Y1HhG2Y',
    authDomain: 'dababble.firebaseapp.com',
    projectId: 'dababble',
    storageBucket: 'dababble.firebasestorage.app',
    messagingSenderId: '946133175704',
    appId: '1:946133175704:web:4ac61b4c6a97ae1d4a6fed',
  },
};
