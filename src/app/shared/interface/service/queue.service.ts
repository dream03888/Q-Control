import { Injectable } from '@angular/core';
import { SocketSupply } from '../../../app.module';
import { ResponseData } from '../response-data';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
// import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class QueueService {
  
  constructor(private socket: SocketSupply , private http: HttpClient) { }



 printOrder(data: any): Observable<any> {
  console.log('📤 Sending print request to C# API:', data);
  return this.http.post('http://localhost:5000/print', data, {
    headers: { 'Content-Type': 'application/json' },
    responseType: 'json'
  });
}

printToWpf(order_number: string) {
  return this.http.post("http://localhost:5555/print", {
    order_number: order_number
  });
}



onQueueRefresh(): Observable<void> {
  return new Observable((sub) => {
    this.socket.off('queue_refresh'); // ⭐ สำคัญ
    this.socket.on('queue_refresh', () => sub.next());
  });
}

  // 🔹 emit เพื่อแจ้ง backend ว่าอยากเช็ค/refresh
  requestRefresh() {
    this.socket.emit('queue_trigger');
  }


 async update_transaction(transaction_id: number): Promise<ResponseData> {
    await this.socket.emit('update_transaction', { transaction_id });
    return await this.socket.fromOneTimeEvent<ResponseData>('return_update_transaction')
      .then((response) => {
        return response;
      });
  }

 async update_transaction_waiting(status: string, transaction_id: number): Promise<ResponseData> {
    await this.socket.emit('update_transaction_waiting', status, transaction_id );
    return await this.socket.fromOneTimeEvent<ResponseData>('return_update_transaction_waiting')
      .then((response) => {
        return response;
      });
  }


   async getQueueWaiting(): Promise<ResponseData> {
    await this.socket.emit('getWaitingQueue');
    return await this.socket.fromOneTimeEvent<ResponseData>('return_getWaitingQueue')
      .then((response) => {
        return response;
      });
  }
 
   async getQueue(): Promise<ResponseData> {
    await this.socket.emit('get_queue');
    return await this.socket.fromOneTimeEvent<ResponseData>('return_get_queue')
      .then((response) => {
        return response;
      });
  }


    async CallGoogleApi(queue:string , transaction_id: number): Promise<ResponseData> {
    await this.socket.emit('req_google_api' , queue ,transaction_id);
    return await this.socket.fromOneTimeEvent<ResponseData>('res_google_api')
      .then((response) => {
        return response;
      });
  }



    async updateStatus(status: string): Promise<ResponseData> {
    await this.socket.emit('insert_transaction',  status);
    return await this.socket
      .fromOneTimeEvent<ResponseData>('status_transaction')
      .then((response) => {
        return response;
      });
  }
  ////-----------------------------------

  //   async GetdataPayment(startDate: string, endDate: string , startTime: string , endTime: string): Promise<ResponseData> {
  //   await this.socket.emit('GetdataPayment', startDate, endDate, startTime, endTime);
  //   return await this.socket.fromOneTimeEvent<ResponseData>('return_GetdataPayment')
  //     .then((response) => { 
  //       return response;
  //     });
  // }
  async GetdataPayment(): Promise<ResponseData> {
    await this.socket.emit('GetdataPayment');
    return await this.socket.fromOneTimeEvent<ResponseData>('return_GetdataPayment')
      .then((response) => { 
        return response;
      });
  }
    async GetdataPaymentByData(params:any , startDate: string , endDate: string): Promise<ResponseData> {
    await this.socket.emit('GetdataPaymentByData', params, startDate, endDate);
    return await this.socket.fromOneTimeEvent<ResponseData>('return_GetdataPaymentByData')
      .then((response) => { 
        return response;
      });
  }

 async update_transaction_json(json: string, status_payment : string ,transaction_id: string): Promise<ResponseData> {
    await this.socket.emit('update_transaction_json', json, status_payment, transaction_id);
    return await this.socket.fromOneTimeEvent<ResponseData>('return_update_transaction_json')
      .then((response) => {
        return response;
      });
  }


/////////-----------------Omise
async RecheckOmisePayment(id: string): Promise<ResponseData> {
  console.log('🔄 Rechecking Omise payment for ID:', id);
    await this.socket.emit('check_charge', id);
    return await this.socket
      .fromOneTimeEvent<ResponseData>('charge_status')
      .then((response) => {
        return response;
      });
  }



async getDataBestseller(startDate?:string, endDate?:string): Promise<ResponseData> {
    await this.socket.emit('getDataBestseller', startDate, endDate);
    return await this.socket.fromOneTimeEvent<ResponseData>('return_getDataBestseller')
      .then((response) => {
        return response;
      });
  }









 async getWaitingQueue(): Promise<ResponseData> {
    await this.socket.emit('getWaitingQueue');
    return await this.socket.fromOneTimeEvent<ResponseData>('return_getWaitingQueue')
      .then((response) => {
        return response;
      });
  }


  
     async getCallQueue(): Promise<ResponseData> {
    await this.socket.emit('get_Callqueue');
    return await this.socket.fromOneTimeEvent<ResponseData>('return_get_Callqueue')
      .then((response) => {
        return response;
      });
  }




  async getWaitingCountQueue(): Promise<ResponseData> {
    await this.socket.emit('getWaitingCountQueue');
    return await this.socket.fromOneTimeEvent<ResponseData>('return_getWaitingCountQueue')
      .then((response) => {
        return response;
      });
  }






     async getAllData(): Promise<ResponseData> {
    await this.socket.emit('get_data_active');
    return await this.socket.fromOneTimeEvent<ResponseData>('return_get_data_active')
      .then((response) => {
        return response;
      });
  }




  async UpdateProductActive(data:any): Promise<ResponseData> {
    await this.socket.emit('req_update_active', data);
    return await this.socket.fromOneTimeEvent<ResponseData>('return_get_data_active')
      .then((response) => {
        return response;
      });
  }


  async getDataError(): Promise<ResponseData> {
    await this.socket.emit('getDataError');
    return await this.socket.fromOneTimeEvent<ResponseData>('return_getDataError')
      .then((response) => {
        return response;
      });
  }









}
