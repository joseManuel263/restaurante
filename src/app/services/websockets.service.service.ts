import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface EntryModel {
  Action_Type: string;
  Value: {
    Name: string;
    Msg: string;
    Rooms:[Room];
  };
}

export interface Room{
  RoomName: string;
  User: number;
}

@Injectable({
  providedIn: 'root',
})
export class WebsocketsServiceService {

  private socket!: WebSocket; //abre la conexion
  private socketOpenPromise: Promise<void> | undefined; //checar que ya este conectado
  public observable: Subject<EntryModel> = new Subject<EntryModel>(); //recibir y ver los mensajes.
  private plataform_id: Object = inject(PLATFORM_ID);
  
  constructor() {
    if (isPlatformBrowser(this.plataform_id) && typeof window != undefined) {
      this.socket = new WebSocket("ws://192.168.1.66:9001");

      this.socketOpenPromise = new Promise<void>((resolve, reject) => {
        if (this.socket != undefined) {
          this.socket.onopen = () => {
            console.log("Connect");
            resolve();
          }
          this.socket.onerror = (event) => {
            reject(event);
          }
        }
      });

      if (this.socket != undefined) {
        this.socket.onclose = () => {
          console.log("Disconect");
        };
      }

      if (this.socket != undefined) {
        this.socket.onmessage = (event) => {
          try {
            const jsonObject: EntryModel = JSON.parse(event.data);
            this.observable.next(jsonObject);
          } catch (error){
            console.error('Error parsing JSON:', error);
          }
        }
      }
    }
  }

  public Listen(eventName: string): Observable<any> {
    return new Observable<any>((observer) => {
      this.observable.subscribe((entry: EntryModel) => {
        switch (entry.Action_Type) {
          case 'message':
            if (entry.Action_Type === eventName) {
              observer.next(entry.Value.Msg);
            }
            break;
          case 'rooms':
            if (entry.Action_Type === eventName) {
              observer.next(entry.Value.Rooms);
            }
            break;
          default:
            console.error("error");
            break;
        }
      });
    });
  }

  public async JoinRoom(roomName: string) {
    try {
      await this.socketOpenPromise;
      const message = {
        Action_Type: 'join',
        Value: {
          Name: roomName,
          Msg: ''
        },
      };
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error connecting to the WebSocket:', error);
    }
  }

  public async Emit(mensaje: string){
    try {
      await this.socketOpenPromise;
      this.socket.send(mensaje);
    } catch (error) {
      console.error("Error connecting: ", error)
    }
  }

  public async EmitToRoom(roomName: string, content: string) {
    try {
      await this.socketOpenPromise;
      const message = {
        Action_Type: 'message',
        Value: {
          Name: roomName,
          Msg: content
        },
      };
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error connecting', error);
    }
  }

  public async LeaveRoom(roomName: string) {
    try {
      await this.socketOpenPromise;
      const message = {
        Action_Type: 'leave',
        Value: {
          Name: roomName,
          Msg: ''
        },
      };
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error connecting to the WebSocket:', error);
    }
  }
}