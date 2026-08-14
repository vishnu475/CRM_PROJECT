import React from 'react';
import { BarChart3, Building2, Eye, Download } from 'lucide-react';
import { Button } from '../../../components/common/Button';

export const DeptPayrollReportView: React.FC = () => {
  const deptReports = [
    { dept: 'Engineering', count: 18, gross: 2450000, net: 2150000, pf: 294000, tds: 240000 },
    { dept: 'Sales & Alliances', count: 12, gross: 1680000, net: 1450000, pf: 201600, tds: 150000 },
    { dept: 'Finance & Accounts', count: 8, gross: 1240000, net: 1080000, pf: 148800, tds: 110000 },
    { dept: 'Human Resources', count: 6, gross: 780000, net: 690000, pf: 93600, tds: 65000 }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-emerald-600" size={18} /> Department-wise Payroll Cost Analytics
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Corporate salary expenditure breakdown across organizational departments.</p>
        </div>
        <Button variant="outline" size="sm">
          <Download size={14} /> Download Dept Summary PDF
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3.5">Department</th>
              <th className="p-3.5">Headcount</th>
              <th className="p-3.5 font-bold text-slate-900">Total Gross Pay</th>
              <th className="p-3.5 text-rose-600">Statutory PF Contrib</th>
              <th className="p-3.5 text-rose-600">TDS Tax Deductions</th>
              <th className="p-3.5 text-right font-black text-emerald-600">Net Disbursal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deptReports.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                  <Building2 size={14} className="text-emerald-600" /> {r.dept}
                </td>
                <td className="p-3.5 font-bold">{r.count} Employees</td>
                <td className="p-3.5 font-bold text-slate-900">₹ {r.gross.toLocaleString()}</td>
                <td className="p-3.5 text-rose-600 font-semibold">₹ {r.pf.toLocaleString()}</td>
                <td className="p-3.5 text-rose-600 font-semibold">₹ {r.tds.toLocaleString()}</td>
                <td className="p-3.5 text-right font-black text-emerald-600">₹ {r.net.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
