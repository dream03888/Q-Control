import { Component, HostListener } from '@angular/core';
import { Queue } from '../../../shared/interface/queue';
import { Router } from '@angular/router';
import { QueueService } from '../../../shared/interface/service/queue.service';
import { XMLParser } from 'fast-xml-parser';
import { SocketSupply } from '../../../app.module';
import { Subject } from 'rxjs/internal/Subject';
import { takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

declare var bootstrap: any;

type Page = 'queue' | 'status' | 'menu';
type Tab = 'main' | 'errorlist';

@Component({
  selector: 'app-queue',
  standalone: false,
  templateUrl: './queue.component.html',
  styleUrl: './queue.component.css',
})
export class QueueComponent {
  // =========================
  // UI STATE
  // =========================
  page: Page = 'queue';
  activeTab: Tab = 'main';
  menuOpen = false;
  statusTab: 'all' | 'success' | 'pending' | 'failed' | 'error' = 'all';

  showConfirmPopup = false;
  pendingQueue: { queue: string; transaction_id: number } | null = null;

  playing: string | null = null;
  _queueString: string = '';

  // =========================
  // DATA
  // =========================
  _data: Queue[] = [];
  _waiting: Queue[] = [];
  _hold: any[] = []; // (ยังไม่ได้ใช้จริงมากนัก แต่คงไว้)

  _allData: any[] = [];
  _errorData: any[] = [];

  changedMenus: Record<number, boolean> = {};

  _datapayment: any[] = [];
  _getbydata: any[] = [];

  // =========================
  // PAYMENT DETAIL
  // =========================
  selectedCharge: any;
  transactionId: any;

  _omiseData: string = '';
  _statusPayment: string = '';

  startDate: string = '';
  endDate: string = '';

  // =========================
  // AUDIO / QUEUE BUFFER
  // =========================
  audioQueue: any[] = [];
  isPlayingAudio = false;

  callQueueBuffer: { queue: string; transaction_id: number }[] = [];
  isPlayingQueue = false;

  private destroy$ = new Subject<void>();
  private confirmAudio = new Audio();
  searchText: string = '';

  constructor(
    private router: Router,
    private getData: QueueService,
    private sockets: SocketSupply,
  ) {}

  // =========================
  // LIFECYCLE
  // =========================
  async ngOnInit() {
    await Promise.all([
      this.getQueue(),
      this.waitQueue(),
      this.getAllData(),
      this.loadCharges(),
      this.getAllDataError(),
    ]);

    this.getData
      .onQueueRefresh()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshQueue());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================
  // NAV / UI HELPERS
  // =========================
  setPage(p: Page) {
    this.page = p;
    this.menuOpen = false;

    // optional: เปลี่ยนหน้าแล้ว reset tab บางหน้า
    if (p === 'queue') this.activeTab = 'main';
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  switchTab(tab: Tab) {
    this.activeTab = tab;
  }

  // =========================
  // KEYBOARD SHORTCUT
  // =========================
  @HostListener('document:keydown', ['$event'])
  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === 'ArrowRight') {
      if (this._data?.length > 0) {
        const first = this._data[0];
        if (first?.queue && first?.transaction_id) {
          this.enqueueQueue(first.queue, first.transaction_id);
        }
      }
    }
  }

  // =========================
  // QUEUE: LOAD / REFRESH
  // =========================
  async refreshQueue() {
    console.log('🔄 Refresh queue data!');
    await Promise.all([this.getQueue(), this.waitQueue()]);
  }

  async getQueue() {
    const data = await this.getData.getQueue();
    if (data.status === 200)
      this._data = Array.isArray(data.msg) ? data.msg : [];
  }

  async waitQueue() {
    const data = await this.getData.getQueueWaiting();
    if (data.status === 200)
      this._waiting = Array.isArray(data.msg) ? data.msg : [];
  }

  // =========================
  // QUEUE: CALL FLOW (BUFFER -> API -> POPUP)
  // =========================
  enqueueQueue(queue: string, transaction_id: number) {
    this.callQueueBuffer.push({ queue, transaction_id });
    if (!this.isPlayingQueue) this.processNextQueue();
  }

  private async processNextQueue() {
    if (this.callQueueBuffer.length === 0) {
      this.isPlayingQueue = false;
      return;
    }

    this.isPlayingQueue = true;
    const next = this.callQueueBuffer.shift();
    if (!next) return;

    await this.CallQueueAPI(next.queue, next.transaction_id);
    this.processNextQueue();
  }

  async CallQueueAPI(queue: string, transaction_id: number) {
    const data = await this.getData.CallGoogleApi(queue, transaction_id);

    if (data.status === 200 && data.msg) {
      await this.playConfirmSound(data.msg);

      // เปิด popup ยืนยัน
      this.pendingQueue = { queue, transaction_id };
      this.showConfirmPopup = true;
    }
  }

  waitQueueConfirm() {
    this.showConfirmPopup = false;
    this.pendingQueue = null;
  }

  async confirmQueueDone() {
    if (!this.pendingQueue) return;

    const tx = this.pendingQueue.transaction_id;
    const res = await this.getData.update_transaction(tx);

    if (res.status === 200) {
      // ✅ ไม่ reload หน้าทิ้ง ๆ — รีเฟรชเฉพาะรายการ
      await this.refreshQueue();
    }

    this.showConfirmPopup = false;
    this.pendingQueue = null;
  }

  // =========================
  // QUEUE: UPDATE STATUS
  // =========================
  async updateTransaction(transactionId: number) {
    const data = await this.getData.update_transaction(transactionId);
    if (data.status === 200) {
      await this.refreshQueue(); // ✅ แทน reload
    }
  }

  async updateTransactionWaiting(status: string, transactionId: number) {
    const data = await this.getData.update_transaction_waiting(
      status,
      transactionId,
    );
    if (data.status === 200) {
      await this.refreshQueue(); // ✅ แทน reload
    }
  }

  // =========================
  // AUDIO
  // =========================
  async playNextAudio() {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      return;
    }

    this.isPlayingAudio = true;
    const data = this.audioQueue.shift();

    this._queueString = data.queue;
    const audioSrc = 'data:audio/mpeg;base64,' + data.audio;

    for (let i = 1; i <= 3; i++) {
      const audio = new Audio(audioSrc);
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
      if (i < 3) await this.delay(800);
    }

    this.playNextAudio();
  }

  async playConfirmSound(base64Audio: string) {
    const audioSrc = 'data:audio/mpeg;base64,' + base64Audio;

    this.confirmAudio.src = audioSrc;
    this.confirmAudio.load();
    this.confirmAudio.playbackRate = 1.0; // ปรับให้ช้าลงได้ 0.85, 0.75 ฯลฯ

    for (let i = 1; i <= 3; i++) {
      await this.playConfirmOnce();
      if (i < 3) await this.delay(600);
    }
  }

  private playConfirmOnce(): Promise<void> {
    return new Promise((resolve) => {
      this.confirmAudio.currentTime = 0;
      this.confirmAudio.onended = () => resolve();
      this.confirmAudio.onerror = () => resolve();
      this.confirmAudio.play().catch(() => resolve());
    });
  }

  private delay(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  // =========================
  // MENU SETTINGS
  // =========================
  async getAllData() {
    const data = await this.getData.getAllData();
    if (data.status === 200) {
      this._allData = Array.isArray(data.msg) ? data.msg : [];
    }
  }

  toggleMenuList(menuId: number, checked: boolean) {
    this.changedMenus[menuId] = checked;
    this._allData = this._allData.map((m) =>
      m.product_id === menuId ? { ...m, active: checked } : m,
    );
  }

  async saveMenuSetting() {
    if (Object.keys(this.changedMenus).length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'ไม่มีการเปลี่ยนแปลง',
        timer: 1200,
        showConfirmButton: false,
      });
      return;
    }

    const payload = Object.entries(this.changedMenus).map(([id, active]) => ({
      product_id: Number(id),
      active,
    }));

    const data = await this.getData.UpdateProductActive(payload);
    if (data.status === 200) {
      this.changedMenus = {}; // ✅ เคลียร์หลัง save
      Swal.fire({
        position: 'center',
        icon: 'success',
        title: 'บันทึกข้อมูลสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: String(data.msg ?? ''),
      });
    }
  }

  // ✅ ลบ typo เดิม (oggleMenuList) ไม่ต้องมีแล้ว
  // oggleMenuList(...) { ... }

  // =========================
  // PAYMENT: LIST
  // =========================
  async loadCharges() {
    const data = await this.getData.GetdataPayment();

    if (data.status === 200) {
      // ✅ normalize: กัน null/undefined ที่ทำให้ includes() พัง
      this._datapayment = (Array.isArray(data.msg) ? data.msg : []).map(
        (x: any) => ({
          ...x,
          status_payment: (x.status_payment ?? '').toString(),
          payment: (x.payment ?? '').toString(),
        }),
      );
    } else {
      this._datapayment = [];
    }
  }

  // =========================
  // PAYMENT: DETAIL MODAL
  // =========================
  async openChargeDetail(transaction_id: any) {
    this.selectedCharge = transaction_id;
    this.transactionId = transaction_id;

    const data = await this.getData.GetdataPaymentByData(
      this.selectedCharge,
      this.startDate,
      this.endDate,
    );

    if (data.status !== 200) return;

    this._getbydata = Array.isArray(data.msg) ? data.msg : [data.msg];

    // parse json/xml
    this._getbydata = await Promise.all(
      this._getbydata.map(async (c: any) => {
        let parsed: any = c.json;

        try {
          if (typeof c.json === 'string' && c.json.trim().startsWith('{')) {
            parsed = JSON.parse(c.json);
            this._omiseData = parsed?.id ?? '';
            this._statusPayment = parsed?.status ?? '';
          } else if (
            typeof c.json === 'string' &&
            c.json.trim().startsWith('<')
          ) {
            const parser = new XMLParser({
              ignoreAttributes: false,
              attributeNamePrefix: '',
            });
            const xmlObj = parser.parse(c.json);
            parsed = xmlObj.xml;
          }
        } catch (e) {
          console.error('❌ Error parsing json/xml:', e);
        }

        return { ...c, json: parsed };
      }),
    );

    const modalEl = document.getElementById('chargeDetailModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  async reloadCharge(charg_id: string) {
    const data = await this.getData.RecheckOmisePayment(charg_id);
    if (data.status === 200) {
      this._omiseData = data.msg;
      await this.updateJsonData(this._omiseData);

      // ✅ ไม่ reload หน้า: รีโหลด list + detail เฉพาะที่จำเป็น
      await this.loadCharges();
      if (this.transactionId) await this.openChargeDetail(this.transactionId);
    }
  }

  async updateJsonData(json: string) {
    const data = await this.getData.update_transaction_json(
      json,
      this._statusPayment,
      this.transactionId,
    );

    if (data.status === 200) {
      console.log('✅ JSON data updated successfully');
    }
  }

  // =========================
  // SLIP: VIEW / PRINT
  // =========================
  printSlip() {
    try {
      const slipBase64 = this._getbydata[0]?.slips;
      if (!slipBase64) {
        Swal.fire({ icon: 'error', title: 'ไม่พบข้อมูลสลิปในระบบ' });
        return;
      }

      let base64Data = slipBase64;
      if (base64Data.startsWith('data:application/pdf;base64,')) {
        base64Data = base64Data.replace('data:application/pdf;base64,', '');
      }

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const fileURL = URL.createObjectURL(blob);
      const win = window.open(fileURL, '_blank');

      if (!win) {
        Swal.fire({
          icon: 'warning',
          title: 'Popup ถูกบล็อก',
          text: 'กรุณาปิด Popup Blocker',
        });
        return;
      }

      win.onload = () => win.focus();
    } catch (err) {
      console.error('❌ Error displaying slip:', err);
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาดในการเปิดสลิป' });
    }
  }

  // =========================
  // PRINTER (ยังเป็น stub)
  // =========================
  // sendToPrinter() {
  //   const data = {
  //     queue: 1005,
  //     ticket: 'POS-1005',
  //     items: [
  //       { name: '🍔 Tiger Burger', qty: 2 },
  //       { name: '🥤 Cola', qty: 1 },
  //     ],
  //     total: 245,
  //   };

  //   this.getData.printOrder(data).subscribe({
  //     next: (res) => {
  //       console.log('✅ Success:', res);
  //       Swal.fire({
  //         icon: 'success',
  //         title: 'พิมพ์สำเร็จ 🖨️',
  //         timer: 1200,
  //         showConfirmButton: false,
  //       });
  //     },
  //     error: (err) => {
  //       console.error('❌ Error:', err);
  //       Swal.fire({ icon: 'error', title: 'เชื่อมต่อเครื่องพิมพ์ไม่ได้' });
  //     },
  //   });
  // }

  // =========================
  // ROUTE NAV
  // =========================
  async ClickDashboard() {
    this.router.navigate(['/dashboard-status']);
  }

  async ClickDashboardQueue() {
    this.router.navigate(['/dashboard-queue']);
  }

    async ClickReport() {
    this.router.navigate(['/report']);
  }
  // =========================
  // (OPTIONAL) OLD MODAL UTILS
  // =========================
  openModal(queue: any) {
    const modalEl = document.getElementById('queueModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  openChargeModal(item: any) {
    const modalEl = document.getElementById('chargeOmiseModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  switchStatusTab(tab: 'all' | 'success' | 'pending' | 'error') {
    this.statusTab = tab;
  }
  get filteredPayments() {
    let list: any[] = [];

    // แท็บ Error หลังบ้าน
    if (this.statusTab === 'error') {
      list = this._errorData;
    }

    if (this.statusTab === 'all') return this._datapayment;

    if (this.statusTab === 'success') {
      list = this._datapayment.filter(
        (x) =>
          x.status_payment?.includes('successful') ||
          x.status_payment?.includes('SUCCESS'),
      );
    }

    // ===== ค้นหาจากเลขที่สินค้า (order_number) =====
    if (!this.searchText) return list;

    const keyword = this.searchText.toLowerCase().trim();

    return list.filter((x) =>
      (x.order_number ?? '').toLowerCase().includes(keyword),
    );

  }

  async getAllDataError() {
    const data = await this.getData.getDataError();
    if (data.status === 200) {
      this._errorData = Array.isArray(data.msg) ? data.msg : [];
    }
  }


sendToPrinter(q: any) {
  this.getData.printToWpf(q.order_number).subscribe({
    next: () => {
      console.log("🖨 PRINT OK");
      alert("พิมพ์เรียบร้อย");
    },
    error: err => {
      console.error("PRINT ERROR", err);
      alert("พิมพ์ไม่สำเร็จ");
    }
  });
}










}
