import {
  Component,
  signal,
} from '@angular/core';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { MainChat } from '../main-chat/main-chat';
import { Thread } from '../thread/thread';
import {
  Channel,
  User,
} from '../../../shared/models';

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

  protected readonly selectedUser =
    signal<User | null>(null);

  /** Uebernimmt den ausgewaehlten Channel. */
  protected onChannelSelected(channel: Channel): void {
    this.selectedUser.set(null);
    this.selectedChannel.set(channel);
  }

  /** Uebernimmt den ausgewaehlten Direktchat-User. */
  protected onUserSelected(user: User): void {
    this.selectedChannel.set(null);
    this.selectedUser.set(user);
  }
}