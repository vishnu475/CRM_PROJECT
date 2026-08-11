import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Users, ShoppingCart, DollarSign, CheckCircle2 } from 'lucide-react';
import { CustomerOutstandingAR, VendorOutstandingAP } from '../types';
import { Badge } from '../../../components/common/Badge';

export const ReceivablesPayablesView: React.FC = () => {
  const [subTab, setSubTab] = useState<'ar' | 'ap'>('ar');

  const customerAR: CustomerOutstandingAR[] = [
    { customerId: 'CUST-001', customerName: 'Globex Corporation', totalInvoiced: 1200000, totalPaid: 750000, outstandingBalance: 450000, dueDate: '2026-08-20', status: 'Current' },
    { customerId: 'CUST-002', customerName: 'Initech LLC', totalInvoiced: 850000, totalPaid: 500000, outstandingBalance: 350000, dueDate: '2026-07-31', status: 'Overdue' },
    { customerId: 'CUST-003', customerName: 'Stark Industries', totalInvoiced: 2500000, totalPaid: 2500000, outstandingBalance: 0, dueDate: '2026-08-01', status: 'Clear' }
  ];

  const vendorAP: VendorOutstandingAP[] = [
    { vendorId: 'VND-101', vendorName: 'Office Supplies Ltd', totalBilled: 350000, totalPaid: 225000, outstandingBalance: 125000, dueDate: '2026-08-25', status: 'Current' },
    { vendorId: 'VND-102', vendorName: 'AWS Cloud Services', totalBilled: 480000, totalPaid: 480000, outstandingBalance: 0, dueDate: '2026-08-10', status: 'Clear' },
    { vendorId: 'VND-103', vendorName: 'Dell Hardware Vendor', totalBilled: 950000, totalPaid: 700000, outstandingBalance: 250000, dueDate: '2026-07-28', status: 'Overdue' }
  ];

  const totalAROutstanding = customerAR.reduce((s, c) => s + c.outstandingBalance, 0);
  const totalAPOutstanding = vendorAP.reduce((s, v) => s + v.outstandingBalance, 0);

  return (
    <div className="space-y-6">
      {/* Top Metric Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl space-y-1">
          <div className="flex justify-between items-center text-emerald-800 font-bold">
            <span className="flex items-center gap-1.5"><ArrowDownLeft size={18} /> Accounts Receivable (AR) — Customer Outstanding</span>
            <Badge variant="success">Code: 1100</Badge>
          </div>
          <p className="text-2xl font-black text-emerald-900">₹ {totalAROutstanding.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-700">Total outstanding balance to collect from Customers.</p>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-5 rounded-xl space-y-1">
          <div className="flex justify-between items-center text-rose-800 font-bold">
            <span className="flex items-center gap-1.5"><ArrowUpRight size={18} /> Accounts Payable (AP) — Vendor Outstanding</span>
            <Badge variant="danger">Code: 2100</Badge>
          </div>
          <p className="text-2xl font-black text-rose-900">₹ {totalAPOutstanding.toLocaleString()}</p>
          <p className="text-[10px] text-rose-700">Total outstanding balance owed to Vendors.</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 text-xs">
        <button
          onClick={() => setSubTab('ar')}
          className={`px-4 py-2 font-bold border-b-2 transition-colors flex items-center gap-2 ${
            subTab === 'ar' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={14} /> Customer AR Ledger (Customer → Accounts Receivable)
        </button>
        <button
          onClick={() => setSubTab('ap')}
          className={`px-4 py-2 font-bold border-b-2 transition-colors flex items-center gap-2 ${
            subTab === 'ap' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShoppingCart size={14} /> Vendor AP Ledger (Vendor → Accounts Payable)
        </button>
      </div>

      {/* AR CUSTOMER OUTSTANDING TABLE */}
      {subTab === 'ar' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3.5">Customer ID</th>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Total Invoiced</th>
                <th className="p-3.5">Total Collected</th>
                <th className="p-3.5 font-bold text-slate-900">Outstanding AR Balance</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerAR.map(c => (
                <tr key={c.customerId} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono text-indigo-600 font-bold">{c.customerId}</td>
                  <td className="p-3.5 font-bold text-slate-900">{c.customerName}</td>
                  <td className="p-3.5">₹ {c.totalInvoiced.toLocaleString()}</td>
                  <td className="p-3.5 text-emerald-600 font-semibold">₹ {c.totalPaid.toLocaleString()}</td>
                  <td className="p-3.5 font-black text-slate-900">₹ {c.outstandingBalance.toLocaleString()}</td>
                  <td className="p-3.5 text-slate-400">{c.dueDate}</td>
                  <td className="p-3.5 text-right">
                    <Badge variant={c.status === 'Clear' ? 'success' : c.status === 'Overdue' ? 'danger' : 'warning'}>
                      {c.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AP VENDOR OUTSTANDING TABLE */}
      {subTab === 'ap' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3.5">Vendor ID</th>
                <th className="p-3.5">Vendor Name</th>
                <th className="p-3.5">Total Billed</th>
                <th className="p-3.5">Total Paid</th>
                <th className="p-3.5 font-bold text-slate-900">Outstanding AP Balance</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendorAP.map(v => (
                <tr key={v.vendorId} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono text-indigo-600 font-bold">{v.vendorId}</td>
                  <td className="p-3.5 font-bold text-slate-900">{v.vendorName}</td>
                  <td className="p-3.5">₹ {v.totalBilled.toLocaleString()}</td>
                  <td className="p-3.5 text-emerald-600 font-semibold">₹ {v.totalPaid.toLocaleString()}</td>
                  <td className="p-3.5 font-black text-rose-600">₹ {v.outstandingBalance.toLocaleString()}</td>
                  <td className="p-3.5 text-slate-400">{v.dueDate}</td>
                  <td className="p-3.5 text-right">
                    <Badge variant={v.status === 'Clear' ? 'success' : v.status === 'Overdue' ? 'danger' : 'warning'}>
                      {v.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
