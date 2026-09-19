import {
  Component,
  signal,
} from '@angular/core';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { MainChat } from '../main-chat/main-chat';
import { Thread } from '../thread/thread';
import { Channel } from '../../../shared/models';

/** Verbindet Header, Sidebar, Main-Chat und Thread im Workspace. */
@Component({
  selector: 'app-chat',
  imports: [
    Header,
    Sidebar,
    MainChat,
    Thread,
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  protected readonly selectedChannel =
    signal<Channel | null>(null);

  /** Uebernimmt den in der Sidebar ausgewaehlten Channel. */
  protected onChannelSelected(channel: Channel): void {
    this.selectedChannel.set(channel);
  }
}