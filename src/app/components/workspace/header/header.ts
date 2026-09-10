import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type HeaderVariant = 'auth-login' | 'auth-register' | 'app' | 'mobile';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  @Input() variant: HeaderVariant = 'app';
}
