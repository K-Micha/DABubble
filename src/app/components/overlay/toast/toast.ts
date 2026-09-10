import { Component, input } from '@angular/core';

/** Zentrierter Bestätigungs-Toast (z. B. "Anmelden" nach dem Passwort-Reset). */
@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class Toast {
  readonly message = input.required<string>();
}
