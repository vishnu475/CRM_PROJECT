import React, { useState } from 'react';
import { Lock, Plus, Edit, CheckSquare, Square, Users, ShieldAlert, ArrowRight } from 'lucide-react';
import { SystemRole } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export interface RoleManagerProps {
  onAssignUserRole?: (roleName: string) => void;
}

export const RoleManager: React.FC<RoleManagerProps> = () => {
  const [roles, setRoles] = useState<SystemRole[]>([
    { id: 'role-1', name: 'Executive', description: 'Full system super-admin privileges across all modules', userCount: 3, isSystemDefault: true },
    { id: 'role-2', name: 'SalesManager', description: 'Sales leads, deals, customers, and quotes management', userCount: 5 },
    { id: 'role-3', name: 'HRAdmin', description: 'Employee master, attendance, leave, and payroll access', userCount: 4 },
    { id: 'role-4', name: 'FinanceAccountant', description: 'Chart of Accounts, vouchers, ledger, and bank access', userCount: 2 }
  ]);

  const [selectedRole, setSelectedRole] = useState<SystemRole>(roles[1]);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });

  // Module permission matrix state for selectedRole
  const [permissionGrid, setPermissionGrid] = useState({
    CRM: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    HRMS: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    Payroll: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    Accounts: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    Banking: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
  });

  const togglePermission = (mod: keyof typeof permissionGrid, perm: keyof (typeof permissionGrid)['CRM']) => {
    setPermissionGrid(prev => ({
      ...prev,
      [mod]: {
        ...prev[mod],
        [perm]: !prev[mod][perm]
      }
    }));
  };

  const handleAddRole = () => {
    const roleId = `role-${roles.length + 1}`;
    const createdRole: SystemRole = { id: roleId, name: newRole.name, description: newRole.description, userCount: 0 };
    setRoles([...roles, createdRole]);
    setSelectedRole(createdRole);
    setIsAddRoleOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Roles List & Matrix Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Role List */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Lock size={16} className="text-purple-600" /> System Roles List
            </h3>
            <Button variant="primary" size="sm" onClick={() => setIsAddRoleOpen(true)}>
              <Plus size={14} /> Add Role
            </Button>
          </div>

          <div className="space-y-2">
            {roles.map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedRole(r)}
                className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedRole.id === r.id ? 'bg-purple-50 border-purple-300 shadow-sm' : 'bg-white border-slate-200 hover:border-purple-200'
                }`}
              >
                <div className="flex justify-between items-center font-bold text-slate-900">
                  <span>{r.name}</span>
                  <Badge variant="neutral">{r.userCount} Users</Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{r.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Permission Matrix Editor for Selected Role */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                RBAC Matrix & Scope: <span className="text-purple-600 font-extrabold">{selectedRole.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{selectedRole.description}</p>
            </div>
            <Button variant="primary" size="sm">
              Save Matrix Changes
            </Button>
          </div>

          {/* Granular Checkbox Grid */}
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
                {(Object.keys(permissionGrid) as Array<keyof typeof permissionGrid>).map((mod) => (
                  <tr key={mod} className="hover:bg-slate-50">
                    <td className="p-3 border font-bold text-slate-900">{mod}</td>
                    {(['view', 'create', 'edit', 'delete', 'approve', 'export'] as const).map((perm) => (
                      <td
                        key={perm}
                        className="p-3 border text-center cursor-pointer select-none"
                        onClick={() => togglePermission(mod, perm)}
                      >
                        {permissionGrid[mod][perm] ? (
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
        </div>
      </div>

      {/* Add Role Modal */}
      <Modal isOpen={isAddRoleOpen} onClose={() => setIsAddRoleOpen(false)} title="Create New Security Role">
        <div className="space-y-4 text-xs">
          <Input label="Role Name" placeholder="e.g. InventoryAuditor" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} />
          <Input label="Description" placeholder="Explain the responsibilities..." value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddRole}>Create Role</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
