import { Component, input } from '@angular/core';

export type IconName =
  | 'mail'
  | 'lock'
  | 'person'
  | 'arrow-back'
  | 'send'
  | 'eye'
  | 'eye-off'
  | 'close'
  | 'hash'
  | 'radio-checked'
  | 'radio-unchecked'
  | 'edit';

/**
 * Inline-SVG-Icons (kein Asset-Request, per `color` einfärbbar via currentColor).
 * Neues Icon: Case in icon.html ergaenzen + Name im Union-Type oben.
 */
@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
})
export class Icon {
  readonly name = input.required<IconName>();
}
