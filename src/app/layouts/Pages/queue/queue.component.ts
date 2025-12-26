import { Component, HostListener } from '@angular/core';
import { jsonFormater, Queue } from '../../../shared/interface/queue';
import { Router } from '@angular/router';
import { QueueService } from '../../../shared/interface/service/queue.service';
import { parseStringPromise } from 'xml2js'; // ต้องติดตั้ง xml2js ก่อน
import { SocketSupply } from '../../../app.module';

declare var bootstrap: any;

@Component({
  selector: 'app-queue',
  standalone: false,
  templateUrl: './queue.component.html',
  styleUrl: './queue.component.css'
})
export class QueueComponent {
 page: 'queue' | 'status' = 'queue';
  activeTab: 'main' | 'hold' = 'main';

  _hold: any[] = [];
  _data: Queue[] = [{} as Queue];
  _waiting: Queue[] = [{} as Queue];
  _queue: string = '';
  transactionId!: string;
  _datapayment: Queue[] = [{} as Queue];
_getbydata: any[] = [];
   audioQueue: any[] = [];
   isPlaying: boolean = false;
isPlayingAudio = false;
  _omiseData: string = '';
  _statusPayment: string = '';
  // 🟨 สำหรับหน้าเช็คสถานะหลังบ้าน
charges: any[] = [];  // 👈 เปลี่ยนจาก jsonFormater[] เป็น array ธรรมดา
  selectedCharge!: number;
  startDate: string = '';
  endDate: string = '';
  startTime: string = '';
  endTime: string = '';
menuOpen = false;
_queueString: string = '';
  playing: string | null = null;
  callQueueBuffer: { queue: string, transaction_id: number }[] = [];
  isPlayingQueue = false;
  selectedQueue: any = null;
  constructor(private router: Router, private getData: QueueService ,     private sockets: SocketSupply
  ) {}

  async ngOnInit() {
    
    // this.updateTransaction(this.transactionId);
    await this.getQueue();
    await this.waitQueue();

    this.getData.onQueueRefresh().subscribe(async () => {
      console.log('🔄 Refresh queue data!');
      await this.getQueue();
      await this.waitQueue();
    });
    await this.filterCharges();
    await this.loadCharges();



this.sockets.emit("register_display"); // 📺 แจ้งว่าเป็นหน้าจอแสดงผล

this.sockets.on("play_queue_audio", async (data: any) => {
    console.log("📥 รับคิวใหม่", data.queue);

    // ❗ อย่า update UI ตอนนี้
    // this._callQueue = data.queue; ← ลบออก

    // แทนที่ด้วย push เข้าคิวเสียง
    this.audioQueue.push(data);
    console.log("🟦 เพิ่มคิวเสียง:", this.audioQueue);
    if (!this.isPlayingAudio) {
    await  this.playNextAudio();
    }
  });
  
  }


async playNextAudio() {
  if (this.audioQueue.length === 0) {
    this.isPlayingAudio = false;
    return;
  }

  this.isPlayingAudio = true;

  const data = this.audioQueue.shift(); 

  // ⭐ อัปเดต UI ตอนนี้ทันที ก่อนเล่นเสียง
  this._queueString = data.queue;
  console.log("🟩 แสดงคิวพร้อมเริ่มเสียง:", this._queueString);

  const audioSrc = 'data:audio/mpeg;base64,' + data.audio;

  // เล่นเสียง 3 รอบเหมือนเดิม
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

  // ทำต่อ
  this.playNextAudio();
}



toggleMenu() {
  this.menuOpen = !this.menuOpen;
}

   @HostListener('document:keydown', ['$event'])
  handleKeyPress(event: KeyboardEvent) {
    // ตัวอย่าง: กด Enter หรือ ArrowRight เพื่อเรียกคิว
    if (event.key === 'Enter' || event.key === 'ArrowRight') {
      console.log('🔊 Key pressed to call next queue')  ;
        if (this._data) {
                console.log('🔊 Key pressed to call ')  ;
        this.enqueueQueue(this._data[0].queue, this._data[0].transaction_id);
      }
    }
  }
   // 📥 เพิ่มคิวเข้า buffer
  enqueueQueue(queue: string, transaction_id: number) {
    this.callQueueBuffer.push({ queue, transaction_id });
    if (!this.isPlayingQueue) {
      this.processNextQueue();
    }
  }

   // 🔁 ดึงคิวถัดไปมาเล่น
  async processNextQueue() {
    if (this.callQueueBuffer.length === 0) {
      this.isPlayingQueue = false;
      return;
    }

    this.isPlayingQueue = true;
    const next = this.callQueueBuffer.shift();
    if (!next) return;

    await this.CallQueueAPI(next.queue, next.transaction_id);

    // ✅ เล่นคิวต่อไปเมื่ออันก่อนจบครบ 3 รอบแล้ว
    this.processNextQueue();
  }

  // 🎧 เรียกคิวจริง (เล่นเสียง 3 รอบ)
  async CallQueueAPI(queue: string, transaction_id: number) {
    const data = await this.getData.CallGoogleApi(queue, transaction_id);

    if (data.status === 200 && data.msg) {
  
    }
  }

  
  
openChargeModal(item: any) {
  console.log("Charge detail modal:", item);
  this.selectedCharge = item;

  const modalEl = document.getElementById('chargeOmiseModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}
  
  // 🔹 ของเดิม
  holdQueue(q: any) {
    this._data = this._data.filter(x => x.transaction_id !== q.transaction_id);
    this._hold.push(q);
  }

  returnQueue(q: any) {
    this._hold = this._hold.filter(x => x.transaction_id !== q.transaction_id);
    this._data.push(q);
  }

  switchTab(tab: 'main' | 'hold') {
    this.activeTab = tab;
  }

  openModal(queue: any) {
    this.selectedQueue = queue;
    const modalEl = document.getElementById('queueModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  refreshQueue() {
    console.log('🔄 refresh queue...');
  }

  async getQueue() {
    const data = await this.getData.getQueue();
    if (data.status == 200) this._data = data.msg;
  }

  async waitQueue() {
    const data = await this.getData.getQueueWaiting();
    if (data.status == 200) this._waiting = data.msg;
  }



  async updateTransaction(transactionId:  number) {
    const data = await this.getData.update_transaction(transactionId);
    if (data.status == 200){
      
    }
  }

  async updateTransactionWaiting(status: string, transactionId: number) {
    const data = await this.getData.update_transaction_waiting(status, transactionId);
    if (data.status == 200) console.log('Transaction updated successfully');
  }

  // 🟨 หน้าเช็คสถานะ
  async loadCharges() {
    const data = await this.getData.GetdataPayment(this.startDate, this.endDate,this.startTime, this.endTime);
    if (data.status === 200){
      this._datapayment = data.msg;
            console.log('Filtered charges:', this._datapayment);

  }

    } 

  async filterCharges() {
    const data = await this.getData.GetdataPayment(this.startDate, this.endDate ,this.startTime , this.endTime);
    if (data.status === 200){
      this._datapayment = data.msg;
      
      console.log('Filtered charges:', this._datapayment);
    
    }
  }
  
async  openChargeDetail(c: any) {
    this.selectedCharge = c;
    console.log(this.selectedCharge);
    this.transactionId = c;
    const data = await this.getData.GetdataPaymentByData(this.selectedCharge , this.startDate , this.endDate);
    if (data.status === 200){
  this._getbydata = Array.isArray(data.msg) ? data.msg : [data.msg];

    // 🔧 แปลง json string ให้เป็น object (JSON หรือ XML)
    this._getbydata = await Promise.all(
      this._getbydata.map(async (c: any) => {
        let parsed: any = c.json;

        try {
          // ✅ ถ้าเป็น JSON
          if (typeof c.json === 'string' && c.json.trim().startsWith('{')) {
            parsed = JSON.parse(c.json);
            this._omiseData = parsed.id;
            this._statusPayment = parsed.status;
          }
          // ✅ ถ้าเป็น XML
          else if (typeof c.json === 'string' && c.json.trim().startsWith('<')) {
            const xmlObj = await parseStringPromise(c.json, { explicitArray: false });
            parsed = xmlObj.xml; // 📦 ดึงเฉพาะ object ภายใต้ <xml>...</xml>
          }
        } catch (e) {
          console.error('❌ Error parsing json/xml:', e);
        }

        return { ...c, json: parsed };
      })
    );

     const modalEl = document.getElementById('chargeDetailModal');
     const modal = new bootstrap.Modal(modalEl);
     modal.show();
    } 
  }

  async updateJsonData(json: string)  {
    console.log('Updating JSON data for transaction ID:', json);
    const data = await this.getData.update_transaction_json(json, this._statusPayment, this.transactionId);  
    if (data.status === 200) {
      console.log('✅ JSON data updated successfully:', data.msg);
    }
  }

  async reloadCharge(charg_id : string) {
    const data = await this.getData.RecheckOmisePayment(charg_id);
    if (data.status === 200){
      this._omiseData = data.msg;
      this.updateJsonData(this._omiseData);
      console.log('Reloaded charge data:', this._omiseData);
      window.location.reload();
    }
  }

viewSlip(c: any) {
  console.log('Viewing slip for charge:', c);
  try {
    if (!c) {
      alert('❌ ไม่มีข้อมูล Slip');
      return;
    }

    // ตรวจว่ามี header "data:application/pdf;base64," หรือไม่
    let base64Data = c;
    if (base64Data.startsWith('data:application/pdf;base64,')) {
      base64Data = base64Data.replace('data:application/pdf;base64,', '');
    }

    // ✅ แปลง Base64 → Blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    // ✅ สร้าง URL แล้วเปิดแท็บใหม่
    const fileURL = URL.createObjectURL(blob);
    const win = window.open(fileURL, '_blank');

    // ✅ auto print เมื่อเปิดแท็บใหม่ (บาง browser ต้องรอโหลด)
    if (win) {
      win.onload = () => win.print();
    }
  } catch (err) {
    console.error('❌ Error displaying slip:', err);
  }
}

  sendToPrinter() {
    const data = {
      queue: 1005,
      ticket: 'POS-1005',
      items: [
        { name: '🍔 Tiger Burger', qty: 2 },
        { name: '🥤 Cola', qty: 1 }
      ],
      total: 245
    };
    this.getData.printOrder(data).subscribe({
  next: (res) => {
    console.log('✅ Success:', res);
    alert('🖨️ พิมพ์สำเร็จ!');
  },
  error: (err) => {
    console.error('❌ Error:', err);
    alert('❌ ไม่สามารถเชื่อมต่อเครื่องพิมพ์ได้');
  }
});
  }


async ClickDashboard() {
  this.router.navigate(['/dashboard-status']);
}


async ClickDashboardQueue() {
  this.router.navigate(['/dashboard-queue']);
}

printSlip() {
  try {
    const slipBase64 = this._getbydata[0]?.slips;
    if (!slipBase64) {
      alert("❌ ไม่พบข้อมูลสลิปในระบบ");
      return;
    }

    // ตรวจว่ามี prefix ไหม
    let base64Data = slipBase64;
    if (base64Data.startsWith("data:application/pdf;base64,")) {
      base64Data = base64Data.replace("data:application/pdf;base64,", "");
    }

    // แปลง Base64 → Blob PDF
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });

    // เปิดแท็บใหม่
    const fileURL = URL.createObjectURL(blob);
    const win = window.open(fileURL, "_blank");

    if (win) {
      win.onload = () => {
        win.focus();
      };
    } else {
      alert("❌ เบราว์เซอร์บล็อกการเปิดหน้าต่าง กรุณาปิด Popup Blocker");
    }

  } catch (err) {
    console.error('❌ Error displaying slip:', err);
    alert("เกิดข้อผิดพลาดในการเปิดสลิป");
  }
}

}
