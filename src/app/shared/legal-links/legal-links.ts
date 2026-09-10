import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Footer-Links fuer alle Auth-Seiten: Impressum + Datenschutz. */
@Component({
  selector: 'app-legal-links',
  imports: [RouterLink],
  templateUrl: './legal-links.html',
  styleUrl: './legal-links.scss',
})
export class LegalLinks {}
