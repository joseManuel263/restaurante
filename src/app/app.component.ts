import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WebsocketsServiceService } from './services/websockets.service.service';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  host: {ngSkipHydration: 'true'},
  imports: [RouterOutlet, FormsModule, ReactiveFormsModule,CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private formBuilder: FormBuilder = inject(FormBuilder); //Inyectamos formbuilder
  private ws: WebsocketsServiceService = inject(WebsocketsServiceService); //Inyectamos servicio

  formulario: FormGroup = this.formBuilder.group({ //formulario
    msg: new FormControl(''),
  });

  formulario3: FormGroup = this.formBuilder.group({ //Input de rooms
    msg: new FormControl(''),
  });

  title = 'prueba'       ;
  roomName = ''  ;
  roomAvaliable: any;
  eventName = '';

  async ngAfterViewInit() {
    this.ListenMessageFromRoom();
    this.ListenFormChanges();
    this.ListenAvaliableRooms();
  }

  // escuchar lo que viene del socket y ponerlo en el formulario
  ListenMessageFromRoom() { //Escucha los mensajes de las rooms
    this.ws.Listen("message").subscribe((msg: string) => {
      console.log(msg);
      this.formulario.get('msg')?.patchValue(msg, { emitEvent: false });
    });
  }

  ListenAvaliableRooms() { //Escucha los mensajes de las rooms
    this.ws.Listen("rooms").subscribe((romsList: any) => {
      this.roomAvaliable = romsList;
    });
  }

  JoinRoom(roomName: string){
    this.ws.JoinRoom(roomName); //nos unimos a la room especificada
    this.roomName = roomName; //Actualiza la room a la que declaramos en el front
    this.ListenMessageFromRoom();//llamamos el metodo listen room para empezar a escuhar a la nueva sala
    this.ListenFormChanges(); //escucha los cambios en los otros formularios
    this.formulario3.reset(); //resetea el input
  }

  ListenFormChanges(){
    //escuchar los cambios del formulario
    this.formulario.get('msg')?.valueChanges.pipe(
      debounceTime(500)
    ).subscribe(value => {
      this.ws.EmitToRoom(this.roomName,this.formulario.value.msg);
    });
  }

}