import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Footer für alle Auth-Seiten: Impressum + Datenschutz. */
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {}
