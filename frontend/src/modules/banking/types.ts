export type BankAccountType = 'Corporate Bank' | 'Cash Register' | 'Petty Cash';
export type BankTxType = 'Deposit' | 'Withdrawal' | 'Transfer' | 'Customer Receipt' | 'Vendor Payment';
export type ReconciliationMatchStatus = 'Matched' | 'Unmatched' | 'Suggested';

export interface ExtendedBankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType: BankAccountType;
  ifscCode: string;
  branchName: string;
  balance: number;
  currency: string;
  status: 'Active' | 'Inactive';
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  txType: BankTxType;
  amount: number;
  accountName: string;
  referenceNumber: string;
  reconciliationStatus: ReconciliationMatchStatus;
  suggestedMatchTx?: string;
}

export interface ReconciliationHistoryLog {
  id: string;
  accountName: string;
  statementDate: string;
  statementBalance: number;
  glBalance: number;
  matchedCount: number;
  status: 'Reconciled' | 'Pending';
  reconciledBy: string;
}

export interface BankingState {
  loaded: boolean;
}
