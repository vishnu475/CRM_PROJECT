import React, { useState } from 'react';
import { Building, Plus, Edit, ShieldCheck, MapPin, FileText, CheckCircle2 } from 'lucide-react';
import { CompanyMasterDetails, BranchMasterDetails } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';

export const CompanyBranchMaster: React.FC = () => {
  const [company, setCompany] = useState<CompanyMasterDetails>({
    companyName: 'Acme Global Enterprise Pvt. Ltd.',
    legalName: 'Acme Software Solutions India Private Limited',
    gstin: '27AAAAA0000A1Z5',
    pan: 'AAAAA0000A',
    tan: 'MUM123456A',
    registeredAddress: 'Level 12, Tower B, Cyber City, Financial District, Mumbai 400051',
    baseCurrency: 'INR (₹)',
    branchesCount: 3
  });

  const [branches, setBranches] = useState<BranchMasterDetails[]>([
    { code: 'HQ-01', name: 'Headquarters (HQ)', city: 'Mumbai', state: 'Maharashtra', gstin: '27AAAAA0000A1Z5', status: 'Active', isPrimary: true },
    { code: 'BR-02', name: 'Tech Hub Branch', city: 'Bengaluru', state: 'Karnataka', gstin: '29AAAAA0000A1Z2', status: 'Active', isPrimary: false },
    { code: 'BR-03', name: 'North Operations', city: 'Delhi NCR', state: 'Delhi', gstin: '07AAAAA0000A1Z8', status: 'Active', isPrimary: false }
  ]);

  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', city: '', state: '', gstin: '' });

  const handleAddBranch = () => {
    const code = `BR-0${branches.length + 1}`;
    setBranches([
      ...branches,
      { code, name: newBranch.name, city: newBranch.city, state: newBranch.state, gstin: newBranch.gstin || '27AAAAA0000A1Z9', status: 'Active', isPrimary: false }
    ]);
    setIsAddBranchOpen(false);
  };

  const toggleBranchStatus = (code: string) => {
    setBranches(branches.map(b => b.code === code ? { ...b, status: b.status === 'Active' ? 'Inactive' : 'Active' } : b));
  };

  return (
    <div className="space-y-6">
      {/* Company Master Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="text-purple-600" size={20} />
              Company Master Profile
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Corporate legal entity, tax numbers, and statutory registrations.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditCompanyOpen(true)}>
            <Edit size={14} /> Edit Company Details
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-100">
          <div>
            <span className="text-slate-400 block font-bold text-[10px] uppercase">Legal Name</span>
            <span className="font-bold text-slate-900">{company.legalName}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-bold text-[10px] uppercase">GSTIN Registration</span>
            <span className="font-mono font-bold text-purple-600">{company.gstin}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-bold text-[10px] uppercase">PAN / TAN</span>
            <span className="font-mono font-bold text-slate-800">{company.pan} / {company.tan}</span>
          </div>
          <div className="md:col-span-3">
            <span className="text-slate-400 block font-bold text-[10px] uppercase">Registered Address</span>
            <span className="text-slate-700 font-semibold">{company.registeredAddress}</span>
          </div>
        </div>
      </div>

      {/* Branch Master Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="text-purple-600" size={18} /> Branch Master ({branches.length} Active Branches)
          </h3>
          <Button variant="primary" size="sm" onClick={() => setIsAddBranchOpen(true)}>
            <Plus size={14} /> Add Branch
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {branches.map(b => (
            <div key={b.code} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-purple-200 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-purple-600 font-bold">{b.code}</span>
                <div className="flex gap-1.5 items-center">
                  {b.isPrimary && <Badge variant="info">Primary HQ</Badge>}
                  <Badge variant={b.status === 'Active' ? 'success' : 'danger'}>{b.status}</Badge>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                <p className="text-xs text-slate-500">{b.city}, {b.state}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-1">Branch GSTIN: {b.gstin}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <button onClick={() => toggleBranchStatus(b.code)} className="text-slate-500 font-bold hover:underline">
                  {b.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
                <button className="text-purple-600 font-bold hover:underline">Edit Branch &rarr;</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Branch Modal */}
      <Modal isOpen={isAddBranchOpen} onClose={() => setIsAddBranchOpen(false)} title="Add New Branch Master">
        <div className="space-y-4 text-xs">
          <Input label="Branch Name" placeholder="e.g. Hyderabad Tech Hub" value={newBranch.name} onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} />
          <Input label="City" placeholder="e.g. Hyderabad" value={newBranch.city} onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })} />
          <Input label="State" placeholder="e.g. Telangana" value={newBranch.state} onChange={(e) => setNewBranch({ ...newBranch, state: e.target.value })} />
          <Input label="Branch GSTIN" placeholder="36AAAAA0000A1Z1" value={newBranch.gstin} onChange={(e) => setNewBranch({ ...newBranch, gstin: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddBranchOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddBranch}>Save Branch</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
