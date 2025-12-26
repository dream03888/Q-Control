export interface Queue {

     transaction_id: number;
     amount: number;
     time: string;
     status: string;
     order_number: string;
     queue:string;
     date: string;
     status_name: string;
     payment: string;
     charge_id: string;
     status_payment: string;

}
export interface jsonFormater {
json: jsonData[];
slip: string;

}
export interface jsonData {

pos_ref_no: string;
response_code: string;
response_msg: string;
transaction_id: number;
invoice_no: string;
card_no: string;
amount: number;
card_approval_code: string;
card_type: string;
trade_type: string;
terminal_id: string;
merchant_id: string;
transaction_type: string;
ipp_terms: string;
monthly_due: string;
total_due: string;
//-------------------------------------json
status: string;
charge_id: string;
}
export interface dashboardData {
product_id: string;
product_name: string;
total_qty: number;
unit_price: number;
amount: number;
}