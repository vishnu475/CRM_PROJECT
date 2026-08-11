import React, { useState } from 'react';
import { TrendingUp, Landmark, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export const FinancialReportsView: React.FC = () => {
  const [statementType, setStatementType] = useState<'pnl' | 'bs'>('pnl');

  const pnlData = {
    totalRevenue: 6500000,
    totalExpense: 3800000,
    netProfit: 2700000,
    revenues: [
      { name: 'Software Product License Sales', amount: 4500000 },
      { name: 'Professional Services & Consulting', amount: 2000000 }
    ],
    expenses: [
      { name: 'Employee Salary & Payroll Expenses', amount: 2800000 },
      { name: 'Cloud Infrastructure & AWS Costs', amount: 480000 },
      { name: 'Office Rent & Facilities', amount: 520000 }
    ]
  };

  const bsData = {
    totalAssets: 5350000,
    totalLiabilities: 375000,
    totalEquity: 4975000,
    assets: [
      { name: 'Trade Receivables (AR)', amount: 800000 },
      { name: 'HDFC Corporate Bank Balance', amount: 4500000 },
      { name: 'Petty Cash Account', amount: 50000 }
    ],
    liabilities: [
      { name: 'Trade Payables (AP)', amount: 375000 }
    ],
    equity: [
      { name: 'Share Capital', amount: 5000000 },
      { name: 'Retained Earnings (Loss)', amount: -25000 }
    ]
  };

  return (
    <div className="space-y-4">
      {/* Sub Tab Switcher */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div className="flex space-x-1 text-xs font-bold">
          <button
            onClick={() => setStatementType('pnl')}
            className={`px-4 py-2 rounded-lg transition-all ${statementType === 'pnl' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Profit & Loss (P&L) Statement
          </button>
          <button
            onClick={() => setStatementType('bs')}
            className={`px-4 py-2 rounded-lg transition-all ${statementType === 'bs' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Balance Sheet Statement
          </button>
        </div>
        <Button variant="outline" size="sm">
          <Download size={14} /> Export Statement PDF
        </Button>
      </div>

      {/* P&L STATEMENT */}
      {statementType === 'pnl' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 max-w-4xl">
          <div className="flex justify-between items-start pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-emerald-600" size={20} /> Profit & Loss Statement (FY 2026-27)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Corporate income, operational expenses, and net profit calculations.</p>
            </div>
            <Badge variant="success">Net Profit: ₹ {pnlData.netProfit.toLocaleString()}</Badge>
          </div>

          <div className="space-y-4 text-xs">
            {/* Revenue */}
            <div className="space-y-2">
              <h4 className="font-bold text-emerald-800 uppercase text-[10px] tracking-wider border-b pb-1">Operating Revenues</h4>
              {pnlData.revenues.map((item, idx) => (
                <div key={idx} className="flex justify-between text-slate-700">
                  <span>{item.name}</span>
                  <span className="font-bold text-slate-900">₹ {item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-extrabold text-emerald-700 pt-2 border-t text-sm">
                <span>Total Revenues (A):</span>
                <span>₹ {pnlData.totalRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Expenses */}
            <div className="space-y-2 pt-4">
              <h4 className="font-bold text-rose-800 uppercase text-[10px] tracking-wider border-b pb-1">Operational Expenses</h4>
              {pnlData.expenses.map((item, idx) => (
                <div key={idx} className="flex justify-between text-slate-700">
                  <span>{item.name}</span>
                  <span className="font-bold text-rose-600">-₹ {item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-extrabold text-rose-700 pt-2 border-t text-sm">
                <span>Total Expenses (B):</span>
                <span>-₹ {pnlData.totalExpense.toLocaleString()}</span>
              </div>
            </div>

            {/* Net Income */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-sm font-black text-emerald-900 mt-4">
              <span>NET PROFIT BEFORE TAX (A - B):</span>
              <span>₹ {pnlData.netProfit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* BALANCE SHEET STATEMENT */}
      {statementType === 'bs' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 max-w-4xl">
          <div className="flex justify-between items-start pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="text-indigo-600" size={20} /> Balance Sheet Statement (As of August 2026)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Assets = Liabilities + Equity balance equation.</p>
            </div>
            <Badge variant="info">Assets: ₹ {bsData.totalAssets.toLocaleString()}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Assets */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-indigo-900 uppercase text-[10px] tracking-wider border-b pb-1">Total Assets</h4>
              {bsData.assets.map((item, idx) => (
                <div key={idx} className="flex justify-between text-slate-700">
                  <span>{item.name}</span>
                  <span className="font-bold text-slate-900">₹ {item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-extrabold text-indigo-900 pt-2 border-t text-sm">
                <span>Total Assets:</span>
                <span>₹ {bsData.totalAssets.toLocaleString()}</span>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="space-y-4">
              <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-rose-800 uppercase text-[10px] tracking-wider border-b pb-1">Total Liabilities</h4>
                {bsData.liabilities.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>{item.name}</span>
                    <span className="font-bold text-rose-600">₹ {item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-extrabold text-rose-800 pt-1 border-t text-xs">
                  <span>Total Liabilities:</span>
                  <span>₹ {bsData.totalLiabilities.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-blue-800 uppercase text-[10px] tracking-wider border-b pb-1">Total Shareholders Equity</h4>
                {bsData.equity.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>{item.name}</span>
                    <span className="font-bold text-slate-900">₹ {item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-extrabold text-blue-800 pt-1 border-t text-xs">
                  <span>Total Equity:</span>
                  <span>₹ {bsData.totalEquity.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
