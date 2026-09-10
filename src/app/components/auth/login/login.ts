import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/auth/auth.service';
import { Icon } from '../../../shared/icon/icon';
import { LegalLinks } from '../../../shared/legal-links/legal-links';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, LegalLinks, Icon],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected onSubmit(): void {
    if (this.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    void this.run(() => this.authService.loginWithEmail(email, password));
  }

  protected onGoogleLogin(): void {
    if (this.loading()) return;
    void this.run(() => this.authService.loginWithGoogle());
  }

  protected onGuestLogin(): void {
    if (this.loading()) return;
    void this.run(() => this.authService.loginAsGuest());
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.setBusy(true);
    try {
      await action();
      await this.router.navigate(['/workspace']);
    } catch (error) {
      this.formError.set(this.authService.toMessage(error));
    } finally {
      this.setBusy(false);
    }
  }

  private setBusy(value: boolean): void {
    this.loading.set(value);
    if (value) this.formError.set(null);
  }

  protected emailError(): string | null {
    const control = this.form.controls.email;
    if (!control.touched || !control.errors) return null;
    if (control.errors['required']) return 'E-Mail ist erforderlich.';
    return 'Diese E-Mail-Adresse ist leider ungültig.';
  }

  protected passwordError(): string | null {
    const control = this.form.controls.password;
    if (!control.touched || !control.errors) return null;
    return 'Passwort ist erforderlich.';
  }
}
