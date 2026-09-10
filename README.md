# DABubble

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.23.

## Setup

```bash
npm install
```

### Firebase

Wir nutzen das native `firebase` SDK (modular, v12) statt `@angular/fire`
(fuer Angular 21 aktuell nur als RC mit kaputten Peer-Deps verfuegbar).
Firebase-Projekt: **dababble**. Auth-Provider: E-Mail/Passwort, Google, Anonym.
Firestore-Collection `users` fuer die Profile. Storage → Supabase.

Web-Config liegt in `src/environments/environment.ts` (kein Secret – wird an
den Client ausgeliefert). Projekt-ID in `.firebaserc`.

Initialisiert wird Firebase in [`src/app/shared/firebase/firebase.providers.ts`](src/app/shared/firebase/firebase.providers.ts)
via `provideFirebase()` (eingebunden in `app.config.ts`). Services injizieren
`FIREBASE_AUTH` / `FIRESTORE` aus `firebase.tokens.ts`.

### Deploy (Firebase Hosting → `dabubble.dimit.cc`)

```bash
npm run deploy   # = ng build + firebase deploy --only hosting
```

Voraussetzung einmalig: `npx -y firebase-tools login`.

`firebase.json` ist konfiguriert: SPA-Rewrite (`** → /index.html`, damit
`/reset-password?oobCode=…` & Co. direkt funktionieren), `index.html`
`no-cache`, gehashte JS/CSS/Fonts `immutable`.

#### Custom Domain einrichten (einmalig)

1. Firebase Console → **Hosting** → **Andere Domain hinzufügen** → `dabubble.dimit.cc`
2. Firebase zeigt DNS-Einträge (A-Records oder TXT + A) → beim DNS von `dimit.cc` eintragen
3. Warten bis Firebase „Verbunden" zeigt (SSL-Zertifikat wird automatisch ausgestellt)

#### Firebase Console – nach dem ersten Deploy erledigen

| Ort                                                                                | Was                                                                                                                                             |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication → **Settings → Autorisierte Domains**                               | `dabubble.dimit.cc` hinzufügen (für Google-Login + Reset-Links)                                                                                 |
| Authentication → **Templates → Passwort zurücksetzen** → ✏️ → Aktions-URL anpassen | `https://dabubble.dimit.cc/reset-password` — dann zeigt der Link in der Reset-Mail auf unsere eigene Seite statt auf die Firebase-Standardseite |
| **Firestore → Rules**                                                              | Regeln für `users/{uid}` veröffentlicht? (Registrierung schreibt dorthin)                                                                       |
| Authentication → **Sign-in method**                                                | E-Mail/Passwort, Google, Anonym aktiv                                                                                                           |

Lokal testen ohne Custom-URL: `oobCode` aus dem Firebase-Reset-Link kopieren
und `http://localhost:4200/reset-password?oobCode=<code>` aufrufen.

## Projektstruktur

```
src/app/
  components/   Feature-Komponenten (auth, channel, workspace, ...)
  pages/        Statische Seiten (Impressum, Datenschutz)
  shared/       Geteilter Code: firebase/, models/ (Firestore-Datenmodell)
  pipes/        Geteilte Pipes
public/img/      Statische Bilder
src/environments/ Umgebungs-Config (Firebase)
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
