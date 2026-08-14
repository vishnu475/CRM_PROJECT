import React, { useState } from 'react';
import { User, Briefcase, DollarSign, CreditCard, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import { Employee, EmployeeLifecycleStatus } from '../../../types';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: Partial<Employee>) => void;
  departments: string[];
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  departments,
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'employment' | 'salary' | 'statutory'>('personal');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('1995-05-15');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [address, setAddress] = useState('');

  const [department, setDepartment] = useState(departments[0] || 'Engineering');
  const [designation, setDesignation] = useState('Software Engineer');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [employmentType, setEmploymentType] = useState<'Full-time' | 'Part-time' | 'Contract' | 'Intern'>('Full-time');
  const [status, setStatus] = useState<EmployeeLifecycleStatus>('Probation');
  const [manager, setManager] = useState('John Doe');
  const [branch, setBranch] = useState('Mumbai HQ');

  const [basicSalary, setBasicSalary] = useState('80000');
  const [allowances, setAllowances] = useState('40000');

  const [panNumber, setPanNumber] = useState('');
  const [uanNumber, setUanNumber] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const totalSalary = (parseFloat(basicSalary) || 0) + (parseFloat(allowances) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setActiveTab('personal');
      return;
    }

    onSave({
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      phone: phone || '+91 98765 00000',
      dob,
      gender,
      address,
      department,
      designation,
      joiningDate,
      employmentType,
      status,
      manager,
      reportingManagerName: manager,
      branch,
      salary: totalSalary,
      basicSalary: parseFloat(basicSalary) || 0,
      allowances: parseFloat(allowances) || 0,
      panNumber,
      uanNumber,
      bankAccount,
      ifscCode,
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Employee Master Record">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Step Navigation Tabs */}
        <div className="flex border-b border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`px-3 py-2 font-semibold border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'personal' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'
            }`}
          >
            <User size={14} /> 1. Personal Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('employment')}
            className={`px-3 py-2 font-semibold border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'employment' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'
            }`}
          >
            <Briefcase size={14} /> 2. Employment Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('salary')}
            className={`px-3 py-2 font-semibold border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'salary' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'
            }`}
          >
            <DollarSign size={14} /> 3. Salary Structure
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('statutory')}
            className={`px-3 py-2 font-semibold border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'statutory' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'
            }`}
          >
            <CreditCard size={14} /> 4. Bank & Statutory
          </button>
        </div>

        {/* TAB 1: PERSONAL INFO */}
        {activeTab === 'personal' && (
          <div className="space-y-3">
            <Input
              label="Full Employee Name *"
              placeholder="e.g. Ravi Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Corporate Email *"
                type="email"
                placeholder="e.g. ravi.k@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Phone Number"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Date of Birth"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
              <Select
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' },
                ]}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Residential Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter complete residential address..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-slate-800 text-xs focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* TAB 2: EMPLOYMENT DETAILS */}
        {activeTab === 'employment' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Department *"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={departments.map((d) => ({ label: d, value: d }))}
              />
              <Input
                label="Designation *"
                placeholder="e.g. Senior Developer"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Joining Date"
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
              <Select
                label="Employment Type"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as any)}
                options={[
                  { label: 'Full-time', value: 'Full-time' },
                  { label: 'Part-time', value: 'Part-time' },
                  { label: 'Contract', value: 'Contract' },
                  { label: 'Intern', value: 'Intern' },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Initial Lifecycle Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                options={[
                  { label: 'Joined', value: 'Joined' },
                  { label: 'Probation', value: 'Probation' },
                  { label: 'Confirmed', value: 'Confirmed' },
                  { label: 'Active', value: 'Active' },
                ]}
              />
              <Input
                label="Branch Location"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              />
            </div>
            <Input
              label="Reporting Manager"
              placeholder="e.g. John Doe (Director)"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
            />
          </div>
        )}

        {/* TAB 3: SALARY STRUCTURE */}
        {activeTab === 'salary' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Basic Salary (Monthly ₹)"
                type="number"
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
              />
              <Input
                label="Allowances (HRA, Special Allowance ₹)"
                type="number"
                value={allowances}
                onChange={(e) => setAllowances(e.target.value)}
              />
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center">
              <span className="font-bold text-emerald-800 text-xs">Total Gross Monthly Salary:</span>
              <span className="font-bold text-emerald-700 text-sm">₹ {totalSalary.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* TAB 4: STATUTORY & BANK */}
        {activeTab === 'statutory' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="PAN Card Number"
                placeholder="e.g. ABCDE1234F"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
              />
              <Input
                label="PF UAN Number"
                placeholder="e.g. 100987654321"
                value={uanNumber}
                onChange={(e) => setUanNumber(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Bank Account Number"
                placeholder="e.g. 98765432101"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
              />
              <Input
                label="IFSC Code"
                placeholder="e.g. HDFC0001234"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
          <div>
            {activeTab !== 'personal' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (activeTab === 'employment') setActiveTab('personal');
                  if (activeTab === 'salary') setActiveTab('employment');
                  if (activeTab === 'statutory') setActiveTab('salary');
                }}
              >
                &larr; Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {activeTab !== 'statutory' ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  if (activeTab === 'personal') setActiveTab('employment');
                  else if (activeTab === 'employment') setActiveTab('salary');
                  else if (activeTab === 'salary') setActiveTab('statutory');
                }}
              >
                Next &rarr;
              </Button>
            ) : (
              <Button type="submit" variant="primary">
                <CheckCircle2 size={14} /> Save Employee Master
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
