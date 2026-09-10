import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/auth/auth.service';
import { LegalLinks } from '../../../shared/legal-links/legal-links';
import { Header } from '../../workspace/header/header';

type RegisterStep = 'form' | 'avatar';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, LegalLinks, Header],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly step = signal<RegisterStep>('form');
  protected readonly loading = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    consent: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });

  private readonly status = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });
  protected readonly formInvalid = computed(() => this.status() !== 'VALID');

  protected goToAvatarStep(): void {
    if (this.formInvalid()) {
      this.form.markAllAsTouched();
      return;
    }
    this.formError.set(null);
    this.step.set('avatar');
  }

  protected goBack(): void {
    if (this.step() === 'avatar') {
      this.step.set('form');
      return;
    }
    void this.router.navigate(['/login']);
  }

  protected async completeRegistration(): Promise<void> {
    if (this.loading()) return;
    const { name, email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.formError.set(null);
    try {
      await this.authService.registerWithEmail(name, email, password);
      await this.router.navigate(['/workspace']);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.loading.set(false);
    }
  }

  private handleError(error: unknown): void {
    this.formError.set(this.authService.toMessage(error));
    this.step.set('form');
  }

  protected nameError(): string | null {
    const control = this.form.controls.name;
    if (!control.touched || !control.errors) return null;
    return 'Bitte schreiben Sie einen Namen.';
  }

  protected emailError(): string | null {
    const control = this.form.controls.email;
    if (!control.touched || !control.errors) return null;
    return '*Diese E-Mail-Adresse ist leider ungültig.';
  }

  protected passwordError(): string | null {
    const control = this.form.controls.password;
    if (!control.touched || !control.errors) return null;
    return 'Bitte geben Sie ein Passwort ein.';
  }
}
