import {
  Component,
  computed,
  HostListener,
  inject,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  ChannelService,
} from '../../../shared/channel/channel.service';
import {
  FIREBASE_AUTH,
} from '../../../shared/firebase/firebase.tokens';
import { Icon } from '../../../shared/icon/icon';
import { Spinner } from '../../../shared/spinner/spinner';

/** Verhindert einen Channel-Namen nur aus Leerzeichen. */
function notBlank(
  control: AbstractControl,
): ValidationErrors | null {
  const value = String(control.value ?? '');

  return value.trim().length === 0
    ? { blank: true }
    : null;
}

/** Dialog zum Erstellen eines neuen Channels. */
@Component({
  selector: 'app-channel-create',
  imports: [
    ReactiveFormsModule,
    Icon,
    Spinner,
  ],
  templateUrl: './channel-create.html',
  styleUrl: './channel-create.scss',
})
export class ChannelCreate {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly channelService =
    inject(ChannelService);

  readonly closed = output<void>();
  readonly created = output<string>();

  protected readonly loading = signal(false);

  protected readonly formError =
    signal<string | null>(null);

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        notBlank,
      ],
    }),
    description: new FormControl('', {
      nonNullable: true,
    }),
  });

  private readonly status = toSignal(
    this.form.controls.name.statusChanges,
    {
      initialValue:
        this.form.controls.name.status,
    },
  );

  protected readonly formInvalid = computed(
    () => this.status() !== 'VALID',
  );

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closed.emit();
  }

  protected onBackdropClick(): void {
    this.closed.emit();
  }

  protected onClose(): void {
    this.closed.emit();
  }

  protected onSubmit(): void {
    if (
      this.loading()
      || this.formInvalid()
    ) {
      this.form.markAllAsTouched();
      return;
    }

    void this.runCreate();
  }

  /** Erstellt den Channel fuer den aktuell angemeldeten User. */
  private async runCreate(): Promise<void> {
    this.loading.set(true);
    this.formError.set(null);

    try {
      await this.createChannel();
    } catch {
      this.setCreateError();
    } finally {
      this.loading.set(false);
    }
  }

  /** Speichert den Channel und gibt dessen ID an die Sidebar weiter. */
  private async createChannel(): Promise<void> {
    const { name, description } =
      this.form.getRawValue();

    const uid =
      this.auth.currentUser?.uid;

    if (!uid) {
      throw new Error('Missing user');
    }

    const id =
      await this.channelService.createChannel(
        name.trim(),
        description.trim(),
        uid,
      );

    this.created.emit(id);
  }

  /** Zeigt den Fehler beim Erstellen des Channels an. */
  private setCreateError(): void {
    this.formError.set(
      'Channel konnte nicht erstellt werden. Bitte versuche es erneut.',
    );
  }
}