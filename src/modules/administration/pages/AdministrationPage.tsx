import React, { useState } from 'react';
import { ShieldCheck, Users, Building, Lock, FileKey, Plus, Edit, CheckSquare, Square } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export const AdministrationPage: React.FC = () => {
  const { companyName } = useApp();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'branches' | 'audit'>('users');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const users = [
    { id: 'usr-1', name: 'John Doe', email: 'admin@company.com', role: 'Executive', status: 'Active', lastLogin: '10 mins ago' },
    { id: 'usr-2', name: 'Robert Vance', email: 'vance@company.com', role: 'SalesManager', status: 'Active', lastLogin: '2 hours ago' },
    { id: 'usr-3', name: 'Emma Watson', email: 'emma@company.com', role: 'HRAdmin', status: 'Active', lastLogin: '1 day ago' },
    { id: 'usr-4', name: 'Michael Brown', email: 'michael@company.com', role: 'FinanceAccountant', status: 'Active', lastLogin: '5 mins ago' }
  ];

  // RBAC permissions grid state
  const [matrix, setMatrix] = useState({
    CRM: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    HRMS: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    Payroll: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    Finance: { view: true, create: true, edit: true, delete: false, approve: true, export: true }
  });

  const toggleMatrix = (module: keyof typeof matrix, perm: keyof (typeof matrix)['CRM']) => {
    setMatrix(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [perm]: !prev[module][perm]
      }
    }));
  };

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
        <Button variant="primary" size="sm" onClick={() => setIsAddUserOpen(true)}>
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
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Interactive Permission Matrix (Role: SalesExecutive)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 border">Module</th>
                  <th className="p-3 border text-center">View</th>
                  <th className="p-3 border text-center">Create</th>
                  <th className="p-3 border text-center">Edit</th>
                  <th className="p-3 border text-center">Delete</th>
                  <th className="p-3 border text-center">Approve</th>
                  <th className="p-3 border text-center">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(Object.keys(matrix) as Array<keyof typeof matrix>).map(mod => (
                  <tr key={mod} className="hover:bg-slate-50">
                    <td className="p-3 border font-bold text-slate-900">{mod}</td>
                    {(['view', 'create', 'edit', 'delete', 'approve', 'export'] as const).map(p => (
                      <td key={p} className="p-3 border text-center cursor-pointer" onClick={() => toggleMatrix(mod, p)}>
                        {matrix[mod][p] ? (
                          <CheckSquare size={16} className="text-purple-600 inline" />
                        ) : (
                          <Square size={16} className="text-slate-300 inline" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" size="sm">Save Permission Matrix</Button>
          </div>
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

      {/* Add User Modal */}
      <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Provision New User">
        <div className="space-y-4 text-xs">
          <Input label="Full Name" placeholder="e.g. Alex Morgan" />
          <Input label="Corporate Email" placeholder="alex@company.com" />
          <Select
            label="Assigned Role"
            options={[
              { label: 'Executive', value: 'Executive' },
              { label: 'SalesManager', value: 'SalesManager' },
              { label: 'HRAdmin', value: 'HRAdmin' },
              { label: 'FinanceAccountant', value: 'FinanceAccountant' }
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsAddUserOpen(false)}>Save User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
