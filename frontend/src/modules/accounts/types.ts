export type AccountGroupType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
export type AccountingVoucherType = 'Receipt' | 'Payment' | 'Contra' | 'Journal';

export interface ExtendedAccountLedger {
  id: string;
  code: string;
  name: string;
  group: AccountGroupType;
  parentGroup?: string;
  openingBalance: number;
  balance: number;
  currency: string;
  isControlAccount?: boolean;
  status: 'Active' | 'Inactive';
}

export interface AccountingVoucher {
  id: string;
  voucherNumber: string;
  voucherType: AccountingVoucherType;
  partyName: string;
  partyType: 'Customer' | 'Vendor' | 'Bank' | 'General';
  date: string;
  accountCode: string;
  accountName: string;
  amount: number;
  narration: string;
  status: 'Posted' | 'Draft' | 'Void';
}

export interface CustomerOutstandingAR {
  customerId: string;
  customerName: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  dueDate: string;
  status: 'Overdue' | 'Current' | 'Clear';
}

export interface VendorOutstandingAP {
  vendorId: string;
  vendorName: string;
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
  dueDate: string;
  status: 'Overdue' | 'Current' | 'Clear';
}

export interface AccountsState {
  loaded: boolean;
}
