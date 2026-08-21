import React, { useState, useEffect } from 'react';
import { BarChart3, Building2, Eye, Download, RefreshCw, UserCheck } from 'lucide-react';
import { Button } from '../../../components/common/Button';

export const DeptPayrollReportView: React.FC = () => {
  const [deptReports, setDeptReports] = useState<Array<{ dept: string; count: number; gross: number; net: number; pf: number; tds: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDynamicDeptReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payroll/confirmed-summary');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const deptMap: Record<string, { count: number; gross: number; net: number; pf: number; tds: number }> = {};
          
          json.data.forEach((e: any) => {
            const dept = e.department || 'Engineering';
            if (!deptMap[dept]) {
              deptMap[dept] = { count: 0, gross: 0, net: 0, pf: 0, tds: 0 };
            }
            deptMap[dept].count += 1;
            deptMap[dept].gross += e.grossPay || 0;
            deptMap[dept].net += e.netPay || 0;
            deptMap[dept].pf += e.pf || 0;
            deptMap[dept].tds += e.tds || 0;
          });

          const formatted = Object.keys(deptMap).map(d => ({
            dept: d,
            ...deptMap[d]
          }));

          setDeptReports(formatted);
        }
      }
    } catch (err) {
      console.warn('⚠️ Department report sync notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDynamicDeptReport();
  }, []);

  const totalGross = deptReports.reduce((sum, r) => sum + r.gross, 0);
  const totalNet = deptReports.reduce((sum, r) => sum + r.net, 0);
  const totalEmployees = deptReports.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-emerald-600" size={18} /> Department-wise Payroll Cost Analytics (Confirmed Employees)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Live salary expenditure aggregated across departments in PostgreSQL database.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDynamicDeptReport} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh DB Data
          </Button>
          <Button variant="outline" size="sm">
            <Download size={14} /> Download Dept Summary PDF
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Department</th>
              <th className="p-3.5">Confirmed Headcount</th>
              <th className="p-3.5 font-bold text-slate-900">Total Monthly Gross</th>
              <th className="p-3.5 text-rose-600">PF 12% Contribution</th>
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
                <td className="p-3.5 font-bold">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                    <UserCheck size={10} /> {r.count} Confirmed
                  </span>
                </td>
                <td className="p-3.5 font-bold text-slate-900">₹ {r.gross.toLocaleString()}</td>
                <td className="p-3.5 text-rose-600 font-semibold">-₹ {r.pf.toLocaleString()}</td>
                <td className="p-3.5 text-rose-600 font-semibold">-₹ {r.tds.toLocaleString()}</td>
                <td className="p-3.5 text-right font-black text-emerald-600 text-sm">₹ {r.net.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold text-slate-900 text-xs border-t border-slate-200">
            <tr>
              <td colSpan={2} className="p-3.5 uppercase tracking-wider">
                Total Confirmed Payroll Disbursal ({totalEmployees} Employees):
              </td>
              <td className="p-3.5 text-slate-900 font-black">₹ {totalGross.toLocaleString()}</td>
              <td colSpan={2}></td>
              <td className="p-3.5 text-right text-emerald-700 font-black text-sm">
                ₹ {totalNet.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
