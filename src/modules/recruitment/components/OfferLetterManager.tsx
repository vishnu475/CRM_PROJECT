import React, { useState } from 'react';
import { Award, Plus, FileText, Send, CheckCircle2, XCircle } from 'lucide-react';
import { OfferDetails, OfferStatusType } from '../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { Modal } from '../../../components/common/Modal';
import { Input } from '../../../components/common/Input';

export const OfferLetterManager: React.FC = () => {
  const [offers, setOffers] = useState<OfferDetails[]>([
    { candidateId: 'cand-2', candidateName: 'Sophia Chen', designation: 'Sales Executive Lead', offeredCtc: 1600000, joiningDate: '2026-09-01', expiryDate: '2026-08-20', status: 'Sent', letterPdfName: 'Offer_Letter_Sophia_Chen.pdf' },
    { candidateId: 'cand-5', candidateName: 'Alex Morgan', designation: 'Senior Software Engineer', offeredCtc: 2100000, joiningDate: '2026-08-25', expiryDate: '2026-08-15', status: 'Accepted', letterPdfName: 'Offer_Letter_Alex_Morgan.pdf' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOffer, setNewOffer] = useState({ candidateName: '', designation: 'Senior Software Engineer', ctc: 1800000, joiningDate: '2026-09-01' });

  const handleGenerateOffer = () => {
    const created: OfferDetails = {
      candidateId: `cand-${Date.now().toString().slice(-3)}`,
      candidateName: newOffer.candidateName,
      designation: newOffer.designation,
      offeredCtc: Number(newOffer.ctc),
      joiningDate: newOffer.joiningDate,
      expiryDate: '2026-08-30',
      status: 'Sent',
      letterPdfName: `Offer_Letter_${newOffer.candidateName.replace(/\s+/g, '_')}.pdf`
    };
    setOffers([created, ...offers]);
    setIsModalOpen(false);
  };

  const getStatusBadgeVariant = (st: OfferStatusType) => {
    switch(st) {
      case 'Accepted': return 'success';
      case 'Sent': return 'warning';
      case 'Declined': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award className="text-amber-600" size={18} /> Offer Letters & Executive Commitments
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Generate offer letters, annual CTC package breakdowns, joining dates, and candidate acceptance tracking.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={14} /> Generate Offer Letter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers.map(o => (
          <div key={o.candidateId} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-amber-200 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{o.candidateName}</h4>
                <p className="text-xs text-amber-700 font-semibold">{o.designation}</p>
              </div>
              <Badge variant={getStatusBadgeVariant(o.status)}>{o.status}</Badge>
            </div>

            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Offered Annual CTC:</span>
                <span className="font-bold text-emerald-600">₹ {o.offeredCtc.toLocaleString()} / yr</span>
              </div>
              <div className="flex justify-between">
                <span>Expected Joining Date:</span>
                <span className="font-bold text-slate-800">{o.joiningDate}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Offer Validity Expiry:</span>
                <span>{o.expiryDate}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1"><FileText size={12} /> {o.letterPdfName}</span>
              <button className="text-amber-600 font-bold hover:underline flex items-center gap-1">
                <Send size={12} /> Resend Offer Email
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Generate Offer Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate Formal Offer Letter">
        <div className="space-y-4 text-xs">
          <Input label="Candidate Full Name" placeholder="e.g. David Miller" value={newOffer.candidateName} onChange={(e) => setNewOffer({ ...newOffer, candidateName: e.target.value })} />
          <Input label="Offered Designation" value={newOffer.designation} onChange={(e) => setNewOffer({ ...newOffer, designation: e.target.value })} />
          <Input label="Offered Annual CTC (₹)" type="number" value={newOffer.ctc} onChange={(e) => setNewOffer({ ...newOffer, ctc: Number(e.target.value) })} />
          <Input label="Expected Joining Date" type="date" value={newOffer.joiningDate} onChange={(e) => setNewOffer({ ...newOffer, joiningDate: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleGenerateOffer}>Generate & Send Offer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
