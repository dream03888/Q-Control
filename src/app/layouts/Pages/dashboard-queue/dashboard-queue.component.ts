import { Component } from '@angular/core';
import { Queue } from '../../../shared/interface/queue';
import { Router } from '@angular/router';
import { QueueService } from '../../../shared/interface/service/queue.service';
import { SocketSupply } from '../../../app.module';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs';
export interface QueueItem {
  id: number;
  queueNumber: string;
  timestamp: Date;
  status: 'waiting' | 'ready' | 'completed';
  
}
  @Component({
    selector: 'app-dashboard-queue',
  standalone: false,
  templateUrl: './dashboard-queue.component.html',
  styleUrl: './dashboard-queue.component.css'
})


export class DashboardQueueComponent {

 // คิวปัจจุบัน + คิวถัดไป (ตัวอย่างข้อมูล)
  currentQueue = 'A015';
  nextQueues: string[] = ['A016', 'A017', 'A018'];
  _data: Queue[] = [{} as Queue];
  _callQueue: Queue[] = [{} as Queue];
  _waitingQueue: Queue[] = [{} as Queue];
  _waitingCountQueue: number = 0;
   audioQueue: any[] = [];
   isPlaying: boolean = false;
isPlayingAudio = false;
_queueString: string = '';
private destroy$ = new Subject<void>();
lastPlayedQueue: string | null = null;

  // ภาพโฆษณา: ใช้ภาพ “เบอร์เกอร์จริง” จาก Unsplash
   idx = 0;
  timer: any;

  slides: string[] = [
    'Assets/09.jpg',
    'Assets/crying-burger.jpg',
    'Assets/crying3.jpg',
    'Assets/menu01.jpg',
    'Assets/PT_BGTIGER_BG_Black.jpg',
  ];

  captions: string[] = [
    '🔥 CHICKEN SMOKY GRILL - 125฿',
    '🍔 BEEF DOUBLE CHEESE BURGER - 159฿',
    '🥤 COMBO SET + FRIES + DRINK - 185฿',
    '🌭 TIGER SPECIAL BURGER - 199฿',
    '🍟 CRISPY FRIES DELUXE - 65฿',
  ];

  constructor(
    private router: Router,

    private getData: QueueService,
    private sockets: SocketSupply
  ) {}

async ngOnInit() {
  await this.getQueue();

  this.getData.onQueueRefresh()
    .pipe(takeUntil(this.destroy$))
    .subscribe(async () => {
      console.log('🔄 Refresh queue data!');
      await this.getQueue();
      await this.getWaitingQueue();
      await this.getWaitingCountQueue();
    });

  this.sockets.emit("register_display");

  this.sockets.off("play_queue_audio"); // ⭐ กันซ้อน
  this.sockets.on("play_queue_audio", async (data: any) => {
    console.log("📥 รับคิวใหม่", data.queue);
    this.audioQueue.push(data);
    if (!this.isPlayingAudio) {
      await this.playNextAudio();
    }
  });
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();

  this.sockets.off("play_queue_audio");
  this.sockets.off("queue_refresh");

  if (this.timer) clearInterval(this.timer);
}


async playNextAudio() {
  // 🔴 ถ้าไม่มีคิว → ปลดสถานะแล้วจบ
  if (this.audioQueue.length === 0) {
    this.isPlayingAudio = false;
    return;
  }

  this.isPlayingAudio = true;

  const data = this.audioQueue.shift();
  if (!data) {
    this.isPlayingAudio = false;
    return;
  }

  // 🛑 กันเล่นซ้ำคิวเดิม
  if (this.lastPlayedQueue === data.queue) {
    // เล่นตัวถัดไปแทน
    await this.playNextAudio();
    return;
  }

  // ⭐ บันทึกว่าคิวนี้ถูกเล่นแล้ว
  this.lastPlayedQueue = data.queue;

  // ⭐ อัปเดต UI ทันที
  this._queueString = data.queue;
  console.log("🟩 แสดงคิวพร้อมเริ่มเสียง:", this._queueString);

  const audioSrc = 'data:audio/mpeg;base64,' + data.audio;

  // 🔊 เล่นเสียง 3 รอบ
  for (let i = 1; i <= 3; i++) {
    const audio = new Audio(audioSrc);
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });

    if (i < 3) await new Promise(r => setTimeout(r, 800));
  }

  console.log("🏁 คิวนี้เล่นเสียงจบ:", data.queue);

  // 🔁 เล่นตัวถัดไป
  await this.playNextAudio();
}





  // 👇 ตัวอย่างเมธอดเผื่อเชื่อม API/Socket ในอนาคต
  setQueues(current: string, next: string[]) {
    this.currentQueue = current;
    this.nextQueues = next.slice(0, 3);
  }

  async getQueue() {
    const data = await this.getData.getQueue();
    if (data.status == 200) {
      this._data = data.msg;
      console.log(this._data);
    }
  }

  async getWaitingQueue() {
    const data = await this.getData.getWaitingQueue();
    if (data.status == 200) {
      this._waitingQueue = data.msg;
      console.log(this._waitingQueue);
    }
  }

  async getCallQueue() {
    const data = await this.getData.getCallQueue();

    if (data.status == 200) {
      this._callQueue = data.msg;
      console.log('getCallQueue',this._callQueue);
    }
  }


    async getWaitingCountQueue() {
    const data = await this.getData.getWaitingCountQueue();
    if (data.status == 200) {
      this._waitingCountQueue = data.msg[0].count;
      console.log(this._waitingCountQueue);
    }
  }


  // async updateTransaction(transactionId: string) {
  //   console.log(transactionId)
  //   const data = await this.getData.update_transaction(transactionId);
  //   if (data.status == 200) console.log('Transaction updated successfully');
  // }









  






}

