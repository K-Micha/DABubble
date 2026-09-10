import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/auth/auth.service';
import { Icon } from '../../../shared/icon/icon';
import { LegalLinks } from '../../../shared/legal-links/legal-links';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, Icon, LegalLinks],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private readonly authService = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly sent = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  private readonly status = toSignal(this.email.statusChanges, {
    initialValue: this.email.status,
  });
  protected readonly emailInvalid = computed(() => this.status() !== 'VALID');

  protected emailError(): string | null {
    if (!this.email.touched || !this.email.errors) return null;
    return '*Diese E-Mail-Adresse ist leider ungültig.';
  }

  protected onSubmit(): void {
    if (this.loading()) return;
    if (this.emailInvalid()) {
      this.email.markAsTouched();
      return;
    }
    void this.send();
  }

  private async send(): Promise<void> {
    this.loading.set(true);
    this.formError.set(null);
    try {
      await this.authService.sendResetEmail(this.email.getRawValue());
      this.sent.set(true);
    } catch (error) {
      this.formError.set(this.authService.toMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
