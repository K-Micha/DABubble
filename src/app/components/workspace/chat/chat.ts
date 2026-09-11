import { Component } from '@angular/core';
import { Header } from '../header/header';
import { MainChat } from '../main-chat/main-chat';
import { Sidebar } from '../sidebar/sidebar';
import { Thread } from '../thread/thread';

/**
 * Workspace-Shell-Grundgeruest (grob, Sprint 1): Header + 3-Spalten-Layout
 * (Sidebar/Main-Chat/Thread). Ersetzt den Sprint-0-Platzhalter, siehe TODO
 * in app.routes.ts. Struktur/Look, NICHT pixelgenau - Michael baut das
 * eigentliche Chat-Layout in main-chat/thread weiter aus.
 */
@Component({
  selector: 'app-chat',
  imports: [Header, Sidebar, MainChat, Thread],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {}
