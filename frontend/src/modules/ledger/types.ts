export type JournalEntryStatus = 'Draft' | 'Posted' | 'Reversed';

export interface JournalLineItem {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo: string;
}

export interface ExtendedJournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  narration: string;
  branch: string;
  debitTotal: number;
  creditTotal: number;
  status: JournalEntryStatus;
  lines: JournalLineItem[];
  reversalEntryNumber?: string;
}

export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  group: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  debitBalance: number;
  creditBalance: number;
}

export interface ProfitLossStatement {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  revenueItems: { name: string; amount: number }[];
  expenseItems: { name: string; amount: number }[];
}

export interface BalanceSheetStatement {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  assetItems: { name: string; amount: number }[];
  liabilityItems: { name: string; amount: number }[];
  equityItems: { name: string; amount: number }[];
}

export interface LedgerState {
  loaded: boolean;
}
