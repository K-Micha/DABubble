import { Component, Input } from '@angular/core';

export type HeaderVariant =
  | 'auth-login'
  | 'auth-register'
  | 'app'
  | 'mobile';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  @Input() variant: HeaderVariant = 'app';
}