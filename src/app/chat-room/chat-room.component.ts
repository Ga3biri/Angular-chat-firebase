import { Component, OnInit, ViewChild } from '@angular/core';
import firebase from 'firebase';
import { DatePipe } from '@angular/common';

import { AngularFireStorage, AngularFireStorageReference, AngularFireUploadTask } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

export const snapshotToArray = (snapshot: any) => {
  const returnArr:any = [];

  snapshot.forEach((childSnapshot: any) => {
      const item = childSnapshot.val();
      item.key = childSnapshot.key;
      returnArr.push(item);
  });

  return returnArr;
};

@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss']
})
export class ChatRoomComponent implements OnInit {

  ref: AngularFireStorageReference;
  task: AngularFireUploadTask;
  uploadProgress: Observable<number>;
  downloadURL;
  uploadState: Observable<string>;
  url;
  show_progress=false;



  selected_name='القسم';
  nickname=Math.random();
  displayedColumns: string[] = ['roomname'];
  rooms = [];
  isLoadingResults = true;
  chats:any;
  users:any;
  @ViewChild('chatcontent') chatcontent: any;
  scrolltop: any = null;
  roomname='chat';
  joined=false;
  public user:any;
  fire_token:any;
  chat_header='Chat Room';
  
  constructor(public datepipe: DatePipe,private afStorage: AngularFireStorage) {}

  ngOnInit(): void {
    this.roomname='Chat Room Test'
    console.log('this.roomname')
    console.log(this.roomname)
    this.enterChatRoom(this.roomname)
    this.previousChat(this.roomname)
  }


  enterChatRoom(room:any) {
    this.joined=true;
    const chat:any = { roomname: '', nickname: '', message: '', date: '', type: '' };
    chat.roomname = room;
    chat.nickname = this.nickname;
    chat.date = this.datepipe.transform(new Date(), 'dd/MM/yyyy HH:mm:ss');
    chat.message = `${this.nickname} enter the room`;
    chat.type = 'join';
    const newMessage = firebase.database().ref('chats/').push();
    newMessage.set(chat);

    firebase.database().ref('roomusers/').orderByChild('roomname').equalTo(room).on('value', (resp: any) => {
      let roomuser = [];
      roomuser = snapshotToArray(resp);
      const user = roomuser.find((x:any) => x.nickname === this.nickname);
      if (user !== undefined) {
        const userRef = firebase.database().ref('roomusers/' + user.key);
        userRef.update({status: 'online'});
      } else {
        const newroomuser:any = { roomname: '', nickname: '', status: '',provider_id:'',user_id:'' };
        newroomuser.roomname = room;
        newroomuser.nickname = this.nickname;
        newroomuser.provider_id = 2;
        newroomuser.user_id = 1;
        newroomuser.status = 'online';
        const newRoomUser = firebase.database().ref('roomusers/').push();
        newRoomUser.set(newroomuser);
      }
    });
  }

  previousChat(room:any){
    firebase.database().ref('chats/').on('value', resp => {
      this.chats = [];
      this.chats = snapshotToArray(resp).filter((a:any)=>a.roomname==room);
      setTimeout(() => this.scrolltop = this.chatcontent.nativeElement.scrollHeight, 500);
    });
    firebase.database().ref('roomusers/').orderByChild('roomname').equalTo(room).on('value', (resp2: any) => {
      const roomusers = snapshotToArray(resp2);
      this.users = roomusers.filter((x:any) => x.status === 'online');
    });
  }



  sendMessage(msg:any){
    if(!msg.value){
      alert('يرجي ادخال رسالة');
    }
    let chat={
      roomname:this.roomname,
      nickname:this.nickname,
      date:this.datepipe.transform(new Date(), 'dd/MM/yyyy HH:mm:ss'),
      message:msg.value,
      type:'message'
    }
    const newMessage = firebase.database().ref('chats/').push();
    newMessage.set(chat);
    msg.value=''
  }


  upload(event) {
    this.show_progress=true;
    const id = Math.random().toString(36).substring(2);
    this.ref = this.afStorage.ref(id);
    this.task = this.ref.put(event.target.files[0]);
    this.uploadProgress = this.task.percentageChanges();
    this.task.snapshotChanges().pipe(
      finalize(() => {
        this.downloadURL = this.ref.getDownloadURL()
        this.downloadURL.subscribe(async url => {
          (this.url = await url)
          let chat={
            roomname:this.roomname,
            nickname:this.nickname,
            date:this.datepipe.transform(new Date(), 'dd/MM/yyyy HH:mm:ss'),
            message:url,
            type:'url'
          }
          const newMessage = firebase.database().ref('chats/').push();
          newMessage.set(chat);
          this.show_progress=false;
        });
      } )
   ).subscribe()
  }
}
