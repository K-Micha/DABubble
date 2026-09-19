import {
  Component,
  EventEmitter,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-profile-menu',
  imports: [],
  templateUrl: './profile-menu.html',
  styleUrl: './profile-menu.scss',
})
export class ProfileMenu {
  @Output() profile = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  /** Oeffnet die Profilansicht. */
  protected onProfileClick(): void {
    this.profile.emit();
  }

  /** Meldet den aktuellen User ab. */
  protected onLogoutClick(): void {
    this.logout.emit();
  }
}