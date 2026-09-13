import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Header } from '../../components/workspace/header/header';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-imprint',
  imports: [Header, Icon],
  templateUrl: './imprint.html',
  styleUrl: './imprint.scss',
})
export class Imprint {
  private readonly location = inject(Location);

  protected goBack(): void {
    this.location.back();
  }
}