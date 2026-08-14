import React, { useState } from 'react';
import { ShieldCheck, Users, Building, Lock, FileKey, Plus, Edit, Search, Filter, CheckCircle2, XCircle, Network, Layers, GitFork, UserX, UserCheck } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

import { CompanyBranchMaster } from '../components/CompanyBranchMaster';
import { HierarchyMaster } from '../components/HierarchyMaster';
import { RoleManager } from '../components/RoleManager';
import { SystemUser } from '../types';

export const AdministrationPage: React.FC = () => {
  const { companyName, activeSubSection, setActiveSubSection } = useApp();
  const validAdminTabs = ['users', 'roles', 'company', 'hierarchy', 'audit'];
  const activeTab = (validAdminTabs.includes(activeSubSection) ? activeSubSection : 'users') as 'users' | 'roles' | 'company' | 'hierarchy' | 'audit';
  const setActiveTab = (tab: 'users' | 'roles' | 'company' | 'hierarchy' | 'audit') => setActiveSubSection(tab);

  // Users State & Filters
  const [users, setUsers] = useState<SystemUser[]>([
    { id: 'usr-1', name: 'John Doe', email: 'admin@company.com', role: 'Executive', branch: 'HQ-01 (Mumbai)', status: 'Active', lastActive: '10 mins ago', createdDate: '2026-01-10' },
    { id: 'usr-2', name: 'Robert Vance', email: 'vance@company.com', role: 'SalesManager', branch: 'HQ-01 (Mumbai)', status: 'Active', lastActive: '2 hours ago', createdDate: '2026-02-15' },
    { id: 'usr-3', name: 'Emma Watson', email: 'emma@company.com', role: 'HRAdmin', branch: 'BR-02 (Bengaluru)', status: 'Active', lastActive: '1 day ago', createdDate: '2026-03-01' },
    { id: 'usr-4', name: 'Michael Brown', email: 'michael@company.com', role: 'FinanceAccountant', branch: 'HQ-01 (Mumbai)', status: 'Active', lastActive: '5 mins ago', createdDate: '2026-03-12' },
    { id: 'usr-5', name: 'Sarah Jenkins', email: 'sarah@company.com', role: 'SalesManager', branch: 'BR-03 (Delhi)', status: 'Inactive', lastActive: '15 days ago', createdDate: '2026-04-05' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'SalesManager', branch: 'HQ-01 (Mumbai)' });

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter === 'All' || u.role === selectedRoleFilter;
    const matchesStatus = selectedStatusFilter === 'All' || u.status === selectedStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleUserStatus = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u));
  };

  const handleAddUser = () => {
    const created: SystemUser = {
      id: `usr-${users.length + 1}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      branch: newUser.branch,
      status: 'Active',
      lastActive: 'Just now',
      createdDate: new Date().toISOString().split('T')[0]
    };
    setUsers([...users, created]);
    setIsAddUserOpen(false);
  };

  const handleSaveUserEdit = () => {
    if (selectedUser) {
      setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
      setSelectedUser(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-purple-600" size={24} />
            Administration & Governance Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage system users, security roles, RBAC matrix, company branches, and department hierarchies.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsAddUserOpen(true)}>
          <Plus size={14} /> Add New User
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'users' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={14} /> User Directory ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'roles' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Lock size={14} /> Role List & RBAC Matrix
        </button>
        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'company' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building size={14} /> Company & Branch Master
        </button>
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'hierarchy' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Network size={14} /> Department & Designation Hierarchies
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

      {/* TAB: ROLES & RBAC MATRIX */}
      {activeTab === 'roles' && <RoleManager />}

      {/* TAB: COMPANY & BRANCH MASTER */}
      {activeTab === 'company' && <CompanyBranchMaster />}

      {/* TAB: HIERARCHIES */}
      {activeTab === 'hierarchy' && <HierarchyMaster />}

      {/* TAB: USER DIRECTORY & MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search users or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={14} className="text-slate-400" />
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none"
              >
                <option value="All">All Roles</option>
                <option value="Executive">Executive</option>
                <option value="SalesManager">SalesManager</option>
                <option value="HRAdmin">HRAdmin</option>
                <option value="FinanceAccountant">FinanceAccountant</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Users</option>
                <option value="Inactive">Inactive Users</option>
              </select>
            </div>
          </div>

          {/* User Table List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Branch Scope</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Last Active</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3.5">{u.email}</td>
                    <td className="p-3.5 font-semibold text-purple-600">{u.role}</td>
                    <td className="p-3.5 text-slate-500">{u.branch}</td>
                    <td className="p-3.5">
                      <Badge variant={u.status === 'Active' ? 'success' : 'danger'}>{u.status}</Badge>
                    </td>
                    <td className="p-3.5 text-slate-400">{u.lastActive}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button onClick={() => toggleUserStatus(u.id)} className="p-1 hover:bg-slate-100 rounded text-slate-600 font-bold" title={u.status === 'Active' ? 'Deactivate' : 'Activate'}>
                        {u.status === 'Active' ? <UserX size={14} className="text-rose-600" /> : <UserCheck size={14} className="text-emerald-600" />}
                      </button>
                      <button onClick={() => setSelectedUser(u)} className="p-1 hover:bg-slate-100 rounded text-purple-600 font-bold" title="Edit User Profile & Role">
                        <Edit size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Immutable Audit Log</h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
              <span>🔒 Role assignment modified for 'Robert Vance' to SalesManager</span>
              <span className="text-slate-400 font-mono">Today, 14:20</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
              <span>🏢 Branch master 'HQ-01' GSTIN updated by Admin</span>
              <span className="text-slate-400 font-mono">Yesterday, 11:45</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
              <span>👤 New user 'Sarah Jenkins' provisioned under SalesManager</span>
              <span className="text-slate-400 font-mono">2 days ago, 09:15</span>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Provision New System User">
        <div className="space-y-4 text-xs">
          <Input label="Full Name" placeholder="e.g. Alex Morgan" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
          <Input label="Corporate Email" placeholder="alex@company.com" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <Select
            label="Assigned System Role"
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            options={[
              { label: 'Executive', value: 'Executive' },
              { label: 'SalesManager', value: 'SalesManager' },
              { label: 'HRAdmin', value: 'HRAdmin' },
              { label: 'FinanceAccountant', value: 'FinanceAccountant' }
            ]}
          />
          <Select
            label="Branch Scope"
            value={newUser.branch}
            onChange={(e) => setNewUser({ ...newUser, branch: e.target.value })}
            options={[
              { label: 'HQ-01 (Mumbai)', value: 'HQ-01 (Mumbai)' },
              { label: 'BR-02 (Bengaluru)', value: 'BR-02 (Bengaluru)' },
              { label: 'BR-03 (Delhi)', value: 'BR-03 (Delhi)' }
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddUser}>Save User</Button>
          </div>
        </div>
      </Modal>

      {/* EDIT USER & ROLE ASSIGNMENT MODAL */}
      {selectedUser && (
        <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title={`Edit User & Role Assignment: ${selectedUser.name}`}>
          <div className="space-y-4 text-xs">
            <Input label="Full Name" value={selectedUser.name} onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} />
            <Input label="Email" value={selectedUser.email} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} />
            <Select
              label="Assigned System Role"
              value={selectedUser.role}
              onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
              options={[
                { label: 'Executive', value: 'Executive' },
                { label: 'SalesManager', value: 'SalesManager' },
                { label: 'HRAdmin', value: 'HRAdmin' },
                { label: 'FinanceAccountant', value: 'FinanceAccountant' }
              ]}
            />
            <Select
              label="Branch Scope"
              value={selectedUser.branch}
              onChange={(e) => setSelectedUser({ ...selectedUser, branch: e.target.value })}
              options={[
                { label: 'HQ-01 (Mumbai)', value: 'HQ-01 (Mumbai)' },
                { label: 'BR-02 (Bengaluru)', value: 'BR-02 (Bengaluru)' },
                { label: 'BR-03 (Delhi)', value: 'BR-03 (Delhi)' }
              ]}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveUserEdit}>Save Profile & Role</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
