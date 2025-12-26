import { Component } from '@angular/core';
import Chart from 'chart.js/auto';
import { QueueService } from '../../../shared/interface/service/queue.service';
import { dashboardData } from '../../../shared/interface/queue';

@Component({
  selector: 'app-dashboard-status',
  standalone: false,
  templateUrl: './dashboard-status.component.html',
  styleUrl: './dashboard-status.component.css'
})
export class DashboardStatusComponent {
 
  _bestSeller: dashboardData[] = [ {} as dashboardData ];
    _mapbestSeller: number = 0;
totalSales: any ;


  startDate: string = '';
  endDate: string = '';
    constructor(private getData: QueueService) {

    }

today = new Date();
  chart: any;

  async ngOnInit() {
   await this.getDataBestseller(this.startDate, this.endDate);
    this.createChart();
  }

 async refreshData() {
    await this.getDataBestseller(this.startDate, this.endDate);
    this.createChart();
    console.log('Refreshing dashboard data...');
  }

  filterByDate() {
    this.refreshData();
  }

async getDataBestseller(startDate?:string, endDate?:string) {
  const data = await this.getData.getDataBestseller(startDate, endDate);

  if (data.status === 200) {
    this._bestSeller = data.msg;

    // ✅ คำนวณยอดขายรวมวันนี้
   this.totalSales = this._bestSeller.reduce((sum, item) => {
  const amount = Number(item.amount || (item.total_qty * item.unit_price));
  return sum + amount;
}, 0);
    console.log("💰 ยอดขายรวมวันนี้:", this.totalSales);
  }
}



 createChart() {
    if (this.chart) this.chart.destroy();
    const ctx = document.getElementById('menuChart') as HTMLCanvasElement;
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this._bestSeller.map(d => d.product_name),
        datasets: [{
          label: 'ยอดขาย (บาท)',
          data: this._bestSeller.map(d => d.amount),
          backgroundColor: ['#FF6384', '#FFCE56', '#36A2EB', '#4BC0C0', '#9966FF'],
          borderWidth: 2
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Kanit', size: 14 } }
          }
        }
      }
    });
  }
}