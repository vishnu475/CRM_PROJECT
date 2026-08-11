import React, { useState } from 'react';
import { ShieldCheck, Users, Building, Lock, FileKey, Check, Plus, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

export const AdministrationPage: React.FC = () => {
  const { companyName, branchName } = useApp();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'branches' | 'audit'>('users');

  const users = [
    { id: 'usr-1', name: 'John Doe', email: 'admin@company.com', role: 'Executive', status: 'Active', lastLogin: '10 mins ago' },
    { id: 'usr-2', name: 'Robert Vance', email: 'vance@company.com', role: 'SalesManager', status: 'Active', lastLogin: '2 hours ago' },
    { id: 'usr-3', name: 'Emma Watson', email: 'emma@company.com', role: 'HRAdmin', status: 'Active', lastLogin: '1 day ago' },
    { id: 'usr-4', name: 'Michael Brown', email: 'michael@company.com', role: 'FinanceAccountant', status: 'Active', lastLogin: '5 mins ago' }
  ];

  const roles = [
    { name: 'Executive', permissions: 'Full Access (All Modules & Audit)', usersCount: 2 },
    { name: 'SalesManager', permissions: 'CRM, Sales, Customers, Quotes', usersCount: 5 },
    { name: 'HRAdmin', permissions: 'HRMS, Attendance, Leave, Payroll, ATS', usersCount: 3 },
    { name: 'FinanceAccountant', permissions: 'COA, Ledger, Vouchers, Banking, Expenses', usersCount: 4 }
  ];

  const branches = [
    { code: 'HQ-01', name: 'Headquarters (HQ)', city: 'Mumbai', status: 'Active', isPrimary: true },
    { code: 'BR-02', name: 'Tech Hub Branch', city: 'Bengaluru', status: 'Active', isPrimary: false },
    { code: 'BR-03', name: 'North Operations', city: 'Delhi NCR', status: 'Active', isPrimary: false }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-purple-600" size={24} />
            Administration & RBAC Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage system access, role permissions, company branches, and security audit logs for {companyName}.
          </p>
        </div>
        <Button variant="primary" size="sm">
          <Plus size={14} /> Add New User
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'users' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={14} /> Users & Scopes
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'roles' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Lock size={14} /> RBAC Matrix
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'branches' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building size={14} /> Company & Branches
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'audit' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileKey size={14} /> Security Audit Log
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3.5">User</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Assigned Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Last Active</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                  <td className="p-3.5">{u.email}</td>
                  <td className="p-3.5 font-semibold text-purple-600">{u.role}</td>
                  <td className="p-3.5"><Badge variant="success">{u.status}</Badge></td>
                  <td className="p-3.5 text-slate-400">{u.lastLogin}</td>
                  <td className="p-3.5 text-right">
                    <button className="p-1 hover:bg-slate-100 rounded text-slate-500"><Edit size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm">{r.name}</h3>
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold">{r.usersCount} Assigned Users</span>
              </div>
              <p className="text-xs text-slate-500">Scope: {r.permissions}</p>
              <div className="pt-2 flex gap-2">
                <Button variant="outline" size="sm">Edit Matrix</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'branches' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {branches.map(b => (
            <div key={b.code} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-purple-600 font-bold">{b.code}</span>
                {b.isPrimary && <Badge variant="info">Primary HQ</Badge>}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{b.name}</h3>
              <p className="text-xs text-slate-500">Location: {b.city}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Immutable Audit Trail</h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
              <span>🔒 Admin modified RBAC Matrix for role SalesExecutive</span>
              <span className="text-slate-400 font-mono">Today, 14:20</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
              <span>👤 New user 'Emma Watson' provisioned under HRAdmin</span>
              <span className="text-slate-400 font-mono">Yesterday, 09:15</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
