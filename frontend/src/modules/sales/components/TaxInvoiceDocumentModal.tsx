import React, { useState, useEffect } from 'react';
import { Invoice, InvoicePaymentRecord } from '../../../types';
import { formatINR } from '../../crm/utils/crmUtils';
import {
  X,
  Printer,
  Mail,
  Download,
  DollarSign,
  Building2,
  Calendar,
  CreditCard,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  SELLER_COMPANY_INFO,
  INDIAN_STATES_GST,
  numberToIndianWords
} from '../utils/gstUtils';
import { CRMInvoicesAPI } from '../../../services/apiService';

interface TaxInvoiceDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onOpenRecordPayment?: (invoice: Invoice) => void;
}

export const TaxInvoiceDocumentModal: React.FC<TaxInvoiceDocumentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onOpenRecordPayment,
}) => {
  const [payments, setPayments] = useState<InvoicePaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'document' | 'payments'>('document');

  useEffect(() => {
    if (invoice && isOpen) {
      setLoadingPayments(true);
      setEmailStatusMessage('');
      CRMInvoicesAPI.getPayments(invoice.id)
        .then(res => {
          if (res?.success && Array.isArray(res.data)) {
            setPayments(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingPayments(false));
    }
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  const isIntraState = invoice.taxType === 'INTRA_STATE' || (!invoice.igstAmount && (invoice.cgstAmount || 0) > 0);
  const outstandingBalance = Math.max(0, invoice.amount - (invoice.paidAmount || 0));

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    setEmailStatusMessage('');
    try {
      const res = await CRMInvoicesAPI.sendEmail(invoice.id);
      if (res?.success) {
        setEmailStatusMessage('✓ Tax invoice copy successfully emailed to customer registered address.');
      } else {
        setEmailStatusMessage(`⚠ ${res?.message || 'Failed to dispatch email'}`);
      }
    } catch (err: any) {
      setEmailStatusMessage(`⚠ ${err?.message || 'Failed to dispatch email'}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Safe fallback line items
  const items = (invoice.items && invoice.items.length > 0)
    ? invoice.items
    : [
        {
          productId: 'SRV-01',
          productName: invoice.notes || 'Enterprise Software Solution & Professional Implementation Services',
          quantity: 1,
          unitPrice: invoice.subtotal || invoice.amount,
          taxRate: 18,
          total: invoice.subtotal || invoice.amount
        }
      ];

  const totalTaxable = invoice.subtotal || (invoice.amount - (invoice.taxAmount || 0));
  const cgst = invoice.cgstAmount || (isIntraState ? (invoice.taxAmount || 0) / 2 : 0);
  const sgst = invoice.sgstAmount || (isIntraState ? (invoice.taxAmount || 0) / 2 : 0);
  const igst = invoice.igstAmount || (!isIntraState ? (invoice.taxAmount || 0) : 0);
  const totalTax = invoice.taxAmount || (cgst + sgst + igst);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-6 flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-lg">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white font-mono">{invoice.invoiceNumber}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  invoice.status === 'Paid'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : invoice.status === 'Partially Paid'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {invoice.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{invoice.customerName}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex bg-slate-800 p-0.5 rounded-lg mr-2 text-xs">
              <button
                onClick={() => setActiveTab('document')}
                className={`px-3 py-1 rounded-md font-medium transition ${activeTab === 'document' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Tax Invoice
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1 ${activeTab === 'payments' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Payments ({payments.length})
              </button>
            </div>

            {outstandingBalance > 0 && onOpenRecordPayment && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRecordPayment(invoice);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
              >
                <DollarSign size={13} /> Record Payment
              </button>
            )}

            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition border border-slate-700"
              title="Email invoice to customer"
            >
              <Mail size={13} /> {isSendingEmail ? 'Sending...' : 'Email'}
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
            >
              <Printer size={13} /> Print / PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {emailStatusMessage && (
          <div className="no-print px-6 py-2 bg-blue-50 border-b border-blue-200 text-blue-900 text-xs font-medium flex items-center justify-between">
            <span>{emailStatusMessage}</span>
            <button onClick={() => setEmailStatusMessage('')} className="text-blue-500 hover:text-blue-800">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Scrollable Document Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          
          {activeTab === 'payments' ? (
            /* PAYMENT HISTORY VIEW */
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Receipts & Payment History</h3>
                  <p className="text-xs text-slate-500">Chronological transaction log for Invoice {invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Balance Due</span>
                  <span className="font-bold text-amber-700 text-sm">{formatINR(outstandingBalance)}</span>
                </div>
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Clock size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600 text-xs">No payments recorded yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click "Record Payment" to register customer remittance.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 text-[11px] font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Reference / UTR #</th>
                        <th className="py-2.5 px-3">Bank Account</th>
                        <th className="py-2.5 px-3 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-medium text-slate-800">{p.paymentDate}</td>
                          <td className="py-2.5 px-3">{p.paymentMethod}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{p.referenceNumber || '—'}</td>
                          <td className="py-2.5 px-3 text-slate-600">{p.bankAccountId || 'Primary Account'}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatINR(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* OFFICIAL GST TAX INVOICE DOCUMENT */
            <div id="print-tax-invoice" className="bg-white rounded-xl shadow-xs border border-slate-300 p-8 text-slate-800 max-w-3xl mx-auto space-y-6">
              
              {/* Top Legal Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">TAX INVOICE</h1>
                  <p className="text-[10px] text-slate-500 font-medium">
                    (Issued under Section 31 of CGST Act, 2017 read with Rule 46 of CGST Rules, 2017)
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded border border-slate-300 bg-slate-50 text-[10px] font-bold uppercase text-slate-700">
                    Original for Recipient
                  </span>
                  <div className="mt-1 font-mono text-xs font-extrabold text-blue-700">
                    {invoice.invoiceNumber}
                  </div>
                </div>
              </div>

              {/* Seller and Buyer 2-Column Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200 rounded-lg p-4 bg-slate-50/40 text-xs">
                
                {/* Seller Box */}
                <div className="space-y-1 sm:pr-4 sm:border-r border-slate-200">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Sold By / Supplier:</div>
                  <div className="font-extrabold text-slate-900 text-sm">{SELLER_COMPANY_INFO.name}</div>
                  <div className="text-slate-600 leading-snug">{SELLER_COMPANY_INFO.address}</div>
                  <div className="pt-1.5 space-y-0.5">
                    <div>
                      <span className="font-semibold text-slate-700">GSTIN: </span>
                      <span className="font-mono font-bold text-slate-900">{SELLER_COMPANY_INFO.gstin}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">State & Code: </span>
                      <span>{SELLER_COMPANY_INFO.state} ({SELLER_COMPANY_INFO.stateCode})</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">PAN / CIN: </span>
                      <span className="font-mono text-[11px]">{SELLER_COMPANY_INFO.pan} / {SELLER_COMPANY_INFO.cin}</span>
                    </div>
                  </div>
                </div>

                {/* Buyer Box */}
                <div className="space-y-1 sm:pl-2">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Billed To / Buyer (Consignee):</div>
                  <div className="font-extrabold text-slate-900 text-sm">{invoice.customerName}</div>
                  <div className="text-slate-600 leading-snug whitespace-pre-line">
                    {invoice.billingAddress || 'Corporate Customer Address'}
                  </div>
                  <div className="pt-1.5 space-y-0.5">
                    <div>
                      <span className="font-semibold text-slate-700">Customer GSTIN: </span>
                      <span className="font-mono font-bold text-slate-900">{invoice.customerGstin || 'UNREGISTERED'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Place of Supply: </span>
                      <span className="font-semibold text-blue-900">{invoice.placeOfSupply || 'Karnataka (29)'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Tax Type: </span>
                      <span className="font-semibold">{isIntraState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-200 rounded-lg p-3 text-xs bg-slate-50/70">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Invoice Date</span>
                  <span className="font-bold text-slate-800">{invoice.date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Payment Due Date</span>
                  <span className="font-bold text-slate-800">{invoice.dueDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Sales Order #</span>
                  <span className="font-mono font-bold text-blue-700">{invoice.salesOrderNumber || 'Direct Order'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Quotation Ref</span>
                  <span className="font-mono text-slate-700">{invoice.quoteNumber || '—'}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold uppercase border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Description of Goods / Services</th>
                      <th className="py-2.5 px-2 text-center w-20">HSN/SAC</th>
                      <th className="py-2.5 px-2 text-center w-12">Qty</th>
                      <th className="py-2.5 px-3 text-right w-24">Rate (₹)</th>
                      <th className="py-2.5 px-3 text-right w-28">Taxable (₹)</th>
                      {isIntraState ? (
                        <>
                          <th className="py-2.5 px-2 text-right w-20">CGST (9%)</th>
                          <th className="py-2.5 px-2 text-right w-20">SGST (9%)</th>
                        </>
                      ) : (
                        <th className="py-2.5 px-2 text-right w-24">IGST (18%)</th>
                      )}
                      <th className="py-2.5 px-3 text-right w-28">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, idx) => {
                      const itemTaxable = (item.quantity * item.unitPrice);
                      const itemTax = (itemTaxable * (item.taxRate || 18)) / 100;
                      const itemCgst = isIntraState ? itemTax / 2 : 0;
                      const itemSgst = isIntraState ? itemTax / 2 : 0;
                      const itemIgst = !isIntraState ? itemTax : 0;
                      const itemTotal = itemTaxable + itemTax;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{item.productName}</div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-500">998313</td>
                          <td className="py-2.5 px-2 text-center font-bold">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{formatINR(item.unitPrice)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium">{formatINR(itemTaxable)}</td>
                          {isIntraState ? (
                            <>
                              <td className="py-2.5 px-2 text-right font-mono text-slate-600">{formatINR(itemCgst)}</td>
                              <td className="py-2.5 px-2 text-right font-mono text-slate-600">{formatINR(itemSgst)}</td>
                            </>
                          ) : (
                            <td className="py-2.5 px-2 text-right font-mono text-purple-700">{formatINR(itemIgst)}</td>
                          )}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatINR(itemTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary and Calculation Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2">
                
                {/* Left: Remittance Bank Account & Words */}
                <div className="space-y-3">
                  {/* Amount in words */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Total Invoice Amount In Words:
                    </span>
                    <span className="font-bold text-slate-800 italic">
                      {numberToIndianWords(invoice.amount)}
                    </span>
                  </div>

                  {/* Remittance Bank Details */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] mb-1">
                      <Landmark size={13} className="text-blue-600" />
                      Bank Account Details for Wire Remittance:
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
                      <div>
                        <span className="text-slate-400">Bank Name: </span>
                        <span className="font-semibold">{invoice.bankDetails?.bankName || 'HDFC Bank Ltd.'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Account No: </span>
                        <span className="font-mono font-bold">{invoice.bankDetails?.accountNumber || '50200012345678'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">IFSC Code: </span>
                        <span className="font-mono font-bold">{invoice.bankDetails?.ifscCode || 'HDFC0001234'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Branch: </span>
                        <span>{invoice.bankDetails?.branch || invoice.bankDetails?.branchName || 'Koramangala, Bengaluru'}</span>
                      </div>
                      {invoice.bankDetails?.upiId && (
                        <div className="col-span-2 pt-0.5">
                          <span className="text-slate-400">UPI VPA: </span>
                          <span className="font-mono font-bold text-blue-700">{invoice.bankDetails.upiId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {invoice.paymentTerms && (
                    <div className="text-[11px] text-slate-500">
                      <strong>Payment Terms: </strong> {invoice.paymentTerms}
                    </div>
                  )}
                </div>

                {/* Right: Tax Breakdown Summary Table */}
                <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <div className="bg-slate-50 px-3 py-2 font-bold text-slate-700 border-b border-slate-200 text-[11px]">
                    Tax Summary & Totals
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Taxable Value:</span>
                      <span className="font-mono font-semibold">{formatINR(totalTaxable)}</span>
                    </div>

                    {isIntraState ? (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>CGST (9.0%):</span>
                          <span className="font-mono">{formatINR(cgst)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>SGST (9.0%):</span>
                          <span className="font-mono">{formatINR(sgst)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-purple-700">
                        <span>IGST (18.0%):</span>
                        <span className="font-mono font-semibold">{formatINR(igst)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-slate-200">
                      <span>Total Tax Amount (GST):</span>
                      <span className="font-mono">{formatINR(totalTax)}</span>
                    </div>

                    <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t-2 border-slate-900">
                      <span>Grand Total:</span>
                      <span className="font-mono text-blue-800">{formatINR(invoice.amount)}</span>
                    </div>

                    <div className="pt-2 border-t border-dashed border-slate-200 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>Amount Received:</span>
                        <span className="font-mono font-semibold text-emerald-700">{formatINR(invoice.paidAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-amber-800">Balance Receivable:</span>
                        <span className="font-mono text-amber-800">{formatINR(outstandingBalance)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Authorized Signatory Footer */}
              <div className="pt-8 flex justify-between items-end border-t border-slate-200 text-xs">
                <div className="text-slate-400 text-[10px] space-y-0.5">
                  <p>• Subject to Bengaluru Jurisdiction.</p>
                  <p>• This is a computer-generated tax invoice verified under GSTN rules.</p>
                </div>
                <div className="text-center space-y-6">
                  <div className="font-bold text-slate-800">For {SELLER_COMPANY_INFO.name}</div>
                  <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500 px-6">
                    Authorized Signatory
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
