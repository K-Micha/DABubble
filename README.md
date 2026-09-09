# DABubble

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.23.

## Setup

```bash
npm install
```

### Firebase

Wir nutzen das native `firebase` SDK (modular, v12) statt `@angular/fire`
(fuer Angular 21 aktuell nur als RC mit kaputten Peer-Deps verfuegbar).

1. In der [Firebase Console](https://console.firebase.google.com/) ein Projekt
   anlegen, Web-App registrieren, **Authentication** (E-Mail/Passwort + Google)
   und **Cloud Firestore** aktivieren.
2. Die Web-Config in `src/environments/environment.ts` **und**
   `src/environments/environment.development.ts` eintragen (die `TODO`-Werte
   ersetzen).
3. Projekt-ID in `.firebaserc` (`default`) setzen.

Initialisiert wird Firebase in [`src/app/shared/firebase/firebase.providers.ts`](src/app/shared/firebase/firebase.providers.ts)
via `provideFirebase()` (eingebunden in `app.config.ts`). Services injizieren
`FIREBASE_AUTH` / `FIRESTORE` aus `firebase.tokens.ts`.

### Deploy (Firebase Hosting)

```bash
npm run build
npx firebase-tools deploy --only hosting
```

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
