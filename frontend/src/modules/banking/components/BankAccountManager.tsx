import React, { useState } from 'react';
import { Landmark, Plus, ArrowUpRight, ArrowDownLeft, Edit, Wallet, Building } from 'lucide-react';
import { ExtendedBankAccount } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

export interface BankAccountManagerProps {
  accounts: ExtendedBankAccount[];
  onAddAccount: (acc: ExtendedBankAccount) => void;
  onDeposit: (accountName: string, amount: number) => void;
  onWithdraw: (accountName: string, amount: number) => void;
}

export const BankAccountManager: React.FC<BankAccountManagerProps> = ({ accounts, onAddAccount, onDeposit, onWithdraw }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedAccDetails, setSelectedAccDetails] = useState<ExtendedBankAccount | null>(null);

  const [newAcc, setNewAcc] = useState({
    bankName: 'ICICI Bank',
    accountName: 'ICICI Corporate Operating Account',
    accountNumber: '998877665544',
    accountType: 'Corporate Bank' as const,
    ifscCode: 'ICIC0009988',
    branchName: 'BKC Mumbai Branch',
    openingBalance: 1000000
  });

  const [txAmount, setTxAmount] = useState(25000);
  const [txAccName, setTxAccName] = useState(accounts[0]?.accountName || 'HDFC Corporate Bank Account');

  const handleSaveAdd = () => {
    const created: ExtendedBankAccount = {
      id: `bnk-${Date.now().toString().slice(-4)}`,
      bankName: newAcc.bankName,
      accountName: newAcc.accountName,
      accountNumber: newAcc.accountNumber,
      accountType: newAcc.accountType,
      ifscCode: newAcc.ifscCode,
      branchName: newAcc.branchName,
      balance: Number(newAcc.openingBalance),
      currency: 'INR',
      status: 'Active'
    };
    onAddAccount(created);
    setIsAddModalOpen(false);
  };

  const handleConfirmDeposit = () => {
    onDeposit(txAccName, Number(txAmount));
    setIsDepositModalOpen(false);
  };

  const handleConfirmWithdraw = () => {
    onWithdraw(txAccName, Number(txAmount));
    setIsWithdrawModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="text-indigo-600" size={18} /> Corporate Bank & Cash Registers ({accounts.length} Accounts)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Corporate checking accounts, savings accounts, and petty cash registers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsDepositModalOpen(true)}>
            <ArrowDownLeft size={14} /> Record Deposit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsWithdrawModalOpen(true)}>
            <ArrowUpRight size={14} /> Record Withdrawal
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={14} /> Add Bank Account
          </Button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map(bnk => (
          <div key={bnk.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-indigo-200 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                {bnk.accountType === 'Petty Cash' ? <Wallet size={14} className="text-amber-600" /> : <Building size={14} className="text-indigo-600" />}
                {bnk.bankName}
              </span>
              <Badge variant={bnk.status === 'Active' ? 'success' : 'danger'}>{bnk.status}</Badge>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-900 truncate">{bnk.accountName}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">₹ {bnk.balance.toLocaleString()}</p>
              <p className="text-[10px] font-mono text-indigo-600 mt-0.5">Acc #: {bnk.accountNumber}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400 text-[10px]">{bnk.branchName}</span>
              <button onClick={() => setSelectedAccDetails(bnk)} className="text-indigo-600 font-bold hover:underline">View Details &rarr;</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Bank Account Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Corporate Bank / Cash Account">
        <div className="space-y-4 text-xs">
          <Input label="Bank Institution Name" placeholder="e.g. ICICI Bank" value={newAcc.bankName} onChange={(e) => setNewAcc({ ...newAcc, bankName: e.target.value })} />
          <Input label="Account Name" placeholder="e.g. ICICI Corporate Operating Account" value={newAcc.accountName} onChange={(e) => setNewAcc({ ...newAcc, accountName: e.target.value })} />
          <Input label="Account Number" placeholder="998877665544" value={newAcc.accountNumber} onChange={(e) => setNewAcc({ ...newAcc, accountNumber: e.target.value })} />
          <Select
            label="Account Type"
            value={newAcc.accountType}
            onChange={(e) => setNewAcc({ ...newAcc, accountType: e.target.value as any })}
            options={[
              { label: 'Corporate Bank Account', value: 'Corporate Bank' },
              { label: 'Cash Register Account', value: 'Cash Register' },
              { label: 'Petty Cash Register', value: 'Petty Cash' }
            ]}
          />
          <Input label="IFSC Code" placeholder="ICIC0009988" value={newAcc.ifscCode} onChange={(e) => setNewAcc({ ...newAcc, ifscCode: e.target.value })} />
          <Input label="Branch Name" placeholder="BKC Mumbai Branch" value={newAcc.branchName} onChange={(e) => setNewAcc({ ...newAcc, branchName: e.target.value })} />
          <Input label="Opening Balance (₹)" type="number" value={newAcc.openingBalance} onChange={(e) => setNewAcc({ ...newAcc, openingBalance: Number(e.target.value) })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveAdd}>Save Account</Button>
          </div>
        </div>
      </Modal>

      {/* Record Deposit Modal */}
      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Record Money Deposit">
        <div className="space-y-4 text-xs">
          <Select
            label="Target Account"
            value={txAccName}
            onChange={(e) => setTxAccName(e.target.value)}
            options={accounts.map(a => ({ label: a.accountName, value: a.accountName }))}
          />
          <Input label="Deposit Amount (₹)" type="number" value={txAmount} onChange={(e) => setTxAmount(Number(e.target.value))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsDepositModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmDeposit}>Confirm Deposit</Button>
          </div>
        </div>
      </Modal>

      {/* Record Withdrawal Modal */}
      <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} title="Record Money Withdrawal">
        <div className="space-y-4 text-xs">
          <Select
            label="Source Account"
            value={txAccName}
            onChange={(e) => setTxAccName(e.target.value)}
            options={accounts.map(a => ({ label: a.accountName, value: a.accountName }))}
          />
          <Input label="Withdrawal Amount (₹)" type="number" value={txAmount} onChange={(e) => setTxAmount(Number(e.target.value))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsWithdrawModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmWithdraw}>Confirm Withdrawal</Button>
          </div>
        </div>
      </Modal>

      {/* View Details Modal */}
      {selectedAccDetails && (
        <Modal isOpen={!!selectedAccDetails} onClose={() => setSelectedAccDetails(null)} title={`Account Details: ${selectedAccDetails.bankName}`}>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg space-y-1">
              <h4 className="font-bold text-slate-900">{selectedAccDetails.accountName}</h4>
              <p className="text-indigo-700 font-mono text-[11px]">Acc Number: {selectedAccDetails.accountNumber} • IFSC: {selectedAccDetails.ifscCode}</p>
              <p className="text-slate-600 font-bold text-sm">Balance: ₹ {selectedAccDetails.balance.toLocaleString()} INR</p>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelectedAccDetails(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
