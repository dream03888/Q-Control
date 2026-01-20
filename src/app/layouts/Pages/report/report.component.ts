import { Component } from '@angular/core';
import { QueueService } from '../../../shared/interface/service/queue.service';
import { SocketSupply } from '../../../app.module';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { DomSanitizer } from '@angular/platform-browser';

type ReportRow = any; // ถ้าคุณอยากให้ strict เดี๋ยวผมทำ interface ให้

@Component({
  selector: 'app-report',
  standalone: false,
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent {
  _waiting: ReportRow[] = [];
  filtered: ReportRow[] = [];
showSlip = false;
slipBase64 = '';
selectedSlip: any = null;
pdfSrc: any = '';

  startDate = '';
  endDate = '';
  q = '';
  payment = '';

  sortKey: string = 'transaction_id';
  sortDir: 'asc' | 'desc' = 'asc';

  constructor(
    private router: Router,
    private getData: QueueService,
    private sockets: SocketSupply,
      private sanitizer: DomSanitizer

  ) {}

  async ngOnInit() {
    // ตั้งค่า default เป็นวันนี้ (ถ้าต้องการ)
    // this.startDate = '2026-01-18';
    // this.endDate = '2026-01-18';
    await this.load();
  }

  async load() {
    const data = await this.getData.getReport(this.startDate, this.endDate);
    if (data?.status === 200) {
      this._waiting = Array.isArray(data.msg) ? data.msg : [];
      this.applyFilters();
    } else {
      this._waiting = [];
      this.filtered = [];
    }
  }

  refresh() {
    this.load();
  }

  applyFilters() {
    const q = (this.q || '').toLowerCase().trim();
    const pay = (this.payment || '').toLowerCase();

    this.filtered = (this._waiting || []).filter(r => {
      const hay = `${r.transaction_id} ${r.order_number} ${r.queue} ${r.payment}`.toLowerCase();
      const okQ = !q || hay.includes(q);
      const okPay = !pay || (r.payment || '').toLowerCase() === pay;
      return okQ && okPay;
    });

    this.sortNow();
  }

  sortBy(key: string) {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.sortNow();
  }

  sortNow() {
    const dir = this.sortDir === 'asc' ? 1 : -1;
    const k = this.sortKey;

    this.filtered = [...this.filtered].sort((a, b) => {
      const av = a?.[k];
      const bv = b?.[k];

      // number
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;

      // string
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }

  sum(rows: any[], key: string) {
    return (rows || []).reduce((acc, r) => acc + (Number(r?.[key]) || 0), 0);
  }

  trackByTx(_: number, r: any) {
    return r.transaction_id;
  }

 exportCsv() {

  const headers = [
    'transaction_id',
    'order_number',
    'queue',
    'payment',
    'before_vat',
    'vat_amount',
    'after_vat',
    'time',
    'items'
  ];

  const lines: string[] = [];
  lines.push('\uFEFF' + headers.join(',')); // BOM กันภาษาไทยเพี้ยน

  for (const r of this.filtered) {

    const itemsText = (r.items || [])
      .map((it: any) => {
        const opt = it.option_name_thai
          ? ` +${it.option_name_thai} x${it.option_qty}`
          : '';
        return `${it.product_name}${opt} x${it.qty}`;
      })
      .join('\n');

    const row = [
      r.transaction_id,
      this.escapeCsv(r.order_number),
      this.escapeCsv(r.queue),
      this.escapeCsv(r.payment),
      r.before_vat,
      r.vat_amount,
      r.after_vat,
      this.escapeCsv(r.time),
      this.escapeCsv(itemsText)
    ];

    lines.push(row.join(','));
  }

  const blob = new Blob([lines.join('\n')], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${this.startDate || 'all'}_${this.endDate || 'all'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
escapeCsv(value: any) {
  const s = String(value ?? '');
  return `"${s.replace(/"/g, '""')}"`;   // แทน replaceAll('"','""')
}

printSlip(row: any) {

  const base64 = row.slips; // PDF base64
  const pdfData = 'data:application/pdf;base64,' + base64;

  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Popup ถูกบล็อก กรุณาอนุญาต popup');
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Print Slip</title>
        <style>
          body { margin:0; }
          iframe { width:100%; height:100vh; border:none; }
        </style>
      </head>
      <body>
        <iframe src="${pdfData}"></iframe>

        <script>
          const iframe = document.querySelector('iframe');
          iframe.onload = function() {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

}
