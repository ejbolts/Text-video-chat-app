import { Injectable } from '@angular/core';
import {io} from 'socket.io-client';
import { Observable } from 'rxjs';
import { ChatMessage } from '../models/chatmessage.model';  

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: any;
  public socketId: string | null = null;
  constructor() {
    this.socket = io('http://localhost:3000');
    this.socket.on('assign-id', (id: string) => {
      this.socketId = id;
  });
  }

  public sendMessage(message: ChatMessage): void {
    this.socket.emit('broadcast', message);
  }

  

  public getSystemMessages(): Observable<ChatMessage> {
    return new Observable<ChatMessage>(observer => {
      this.socket.on('system-message', (message: ChatMessage) => {
        observer.next(message);
      });
    });
}


  public getMessages(): Observable<ChatMessage> {
    return new Observable<ChatMessage>(observer => {
      this.socket.on('broadcast', (message: ChatMessage) => {
        observer.next(message);
      });
    });
  }
}
