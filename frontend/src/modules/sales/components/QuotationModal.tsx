import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Quotation, QuotationItem, Product, Opportunity } from '../../../types';
import { formatINR } from '../../crm/utils/crmUtils';
import { Plus, Trash2, Calendar, User, Building2, Tag, X, Send, Save, AlertCircle, Loader2, Mail } from 'lucide-react';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationToEdit?: Quotation | null;
  isRevisionMode?: boolean;
  initialLeadId?: string;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  quotationToEdit,
  isRevisionMode = false,
  initialLeadId,
}) => {
  const { leads, customers, opportunities, contacts, products, addQuotation, updateQuotation, sendQuotation, userProfile, addOpportunity, addContact } = useApp();

  // Quick Add Opportunity inline states
  const [isAddingOpp, setIsAddingOpp] = useState(false);
  const [newOppName, setNewOppName] = useState('');
  const [newOppValue, setNewOppValue] = useState<string | number>('');
  const [newOppStage, setNewOppStage] = useState<'Proposal' | 'Qualified' | 'Negotiation' | 'New'>('Proposal');
  const [isSavingOpp, setIsSavingOpp] = useState(false);
  const [oppError, setOppError] = useState('');

  // Quick Add Contact inline states
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactDesignation, setNewContactDesignation] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactError, setContactError] = useState('');

  const [leadId, setLeadId] = useState('');

  const [customerId, setCustomerId] = useState('');
  const [opportunityId, setOpportunityId] = useState('');
  const [contactId, setContactId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [date, setDate] = useState('');
  const [owner, setOwner] = useState('');
  const [terms, setTerms] = useState('Standard payment terms: 30 days from invoice date. Delivery within 14 business days.');
  const [notes, setNotes] = useState('');
  
  // Line items state
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [overallDiscountPercent, setOverallDiscountPercent] = useState<number>(0);

  // Form submission and validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = React.useRef(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Two decimal places rounding utility to avoid floating point anomalies
  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  // Default sales rep from userProfile
  const defaultOwnerName = useMemo(() => {
    return userProfile?.name || 'Sales Executive';
  }, [userProfile]);

  const eligibleLeads = useMemo(() => {
    return leads.filter(l => ['Qualified', 'Proposal', 'Negotiation'].includes(l.stage));
  }, [leads]);

  const handleLeadSelect = (selLeadId: string) => {
    setLeadId(selLeadId);
    if (!selLeadId) return;
    const lead = leads.find(l => l.id === selLeadId);
    if (lead) {
      const matchedCust = customers.find(c => 
        (lead.convertedToCustomerId && c.id === lead.convertedToCustomerId) ||
        (c.customerName && (c.customerName.toLowerCase() === lead.company.toLowerCase() || c.customerName.toLowerCase() === lead.name.toLowerCase()))
      );
      if (matchedCust) {
        setCustomerId(matchedCust.id);
      }
      const matchedContact = contacts.find(con => con.leadId === lead.id || (matchedCust && con.customerId === matchedCust.id) || con.email === lead.email);
      if (matchedContact) {
        setContactId(matchedContact.id);
      }
      if (!notes && lead.requirement) {
        setNotes(`Customer Requirement: ${lead.requirement}`);
      }
      if ((lead.budget || lead.value) && (items.length === 0 || (items.length === 1 && items[0].productName.includes('Service')))) {
        const budgetVal = lead.budget || lead.value || 0;
        setItems([
          {
            productName: lead.requirement ? `Solution: ${lead.requirement.slice(0, 50)}` : 'Qualified Solution & Services',
            quantity: 1,
            unitPrice: Math.round(budgetVal / 1.18),
            taxRate: 18,
            total: budgetVal,
            mode: 'custom',
            scope: lead.requirement || '',
          }
        ]);
      }
    }
  };

  // Initialize form state
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage('');
    setIsSubmitting(false);

    setIsAddingOpp(false);
    setNewOppName('');
    setNewOppValue('');
    setNewOppStage('Proposal');
    setOppError('');

    setIsAddingContact(false);
    setNewContactName('');
    setNewContactEmail('');
    setNewContactPhone('');
    setNewContactDesignation('');
    setContactError('');

    if (quotationToEdit) {
      setLeadId(quotationToEdit.leadId || '');
      setCustomerId(quotationToEdit.customerId || '');
      setOpportunityId(quotationToEdit.opportunityId || '');
      setContactId(quotationToEdit.contactId || '');
      setDate(quotationToEdit.date || new Date().toISOString().split('T')[0]);
      setValidUntil(quotationToEdit.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setOwner(quotationToEdit.owner || defaultOwnerName);
      setTerms(quotationToEdit.terms || 'Standard payment terms: 30 days from invoice date. Delivery within 14 business days.');
      setNotes(quotationToEdit.notes || '');

      if (quotationToEdit.subtotal && quotationToEdit.discountAmount && quotationToEdit.subtotal > 0) {
        const discPct = Math.round((quotationToEdit.discountAmount / quotationToEdit.subtotal) * 100);
        setOverallDiscountPercent(Math.min(100, Math.max(0, discPct)));
      } else {
        setOverallDiscountPercent(0);
      }

      if (quotationToEdit.items && quotationToEdit.items.length > 0) {
        setItems(quotationToEdit.items.map(it => {
          let mode: 'catalog' | 'custom' = it.productId ? 'catalog' : 'custom';
          let scope = (it as any).scope || '';
          let name = it.productName || '';
          if (!scope && name.includes(' — ')) {
            const parts = name.split(' — ');
            name = parts[0];
            scope = parts.slice(1).join(' — ');
          }
          return {
            ...it,
            productName: name,
            scope,
            mode,
          };
        }));
      } else if (quotationToEdit.amount) {
        setItems([
          {
            productName: 'Quoted Solution & Services',
            quantity: 1,
            unitPrice: Math.round(quotationToEdit.amount / 1.18),
            taxRate: 18,
            total: quotationToEdit.amount,
            mode: 'custom',
            scope: '',
          }
        ]);
      }
    } else {
      const initLead = initialLeadId ? leads.find(l => l.id === initialLeadId) : null;
      if (initLead) {
        setLeadId(initLead.id);
        const matchedCust = customers.find(c => 
          (initLead.convertedToCustomerId && c.id === initLead.convertedToCustomerId) ||
          (c.customerName && (c.customerName.toLowerCase() === initLead.company.toLowerCase() || c.customerName.toLowerCase() === initLead.name.toLowerCase()))
        );
        setCustomerId(matchedCust?.id || customers[0]?.id || '');
        const matchedContact = contacts.find(con => con.leadId === initLead.id || (matchedCust && con.customerId === matchedCust.id) || con.email === initLead.email);
        setContactId(matchedContact?.id || '');
      } else {
        setLeadId('');
        const defaultCust = customers[0]?.id || '';
        setCustomerId(defaultCust);
        setContactId('');
      }
      setOpportunityId('');
      setDate(new Date().toISOString().split('T')[0]);
      setValidUntil(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setOwner(defaultOwnerName);
      setTerms('Standard payment terms: 30 days from invoice date. Delivery within 14 business days.');
      setNotes('');
      setOverallDiscountPercent(0);

      if (products.length > 0) {
        const p = products[0];
        setItems([
          {
            productId: p.id,
            productName: p.name,
            quantity: 1,
            unitPrice: p.price,
            taxRate: p.taxRate || 18,
            total: Math.round(p.price * (1 + (p.taxRate || 18) / 100)),
            mode: 'catalog',
            scope: '',
          }
        ]);
      } else {
        setItems([
          {
            productName: 'Enterprise Cloud Deployment & Implementation',
            quantity: 1,
            unitPrice: 500000,
            taxRate: 18,
            total: 590000,
            mode: 'custom',
            scope: '',
          }
        ]);
      }
    }
  }, [quotationToEdit, isOpen, customers, products, defaultOwnerName]);

  // Filtered contacts for selected customer
  const availableContacts = useMemo(() => {
    if (!customerId) return contacts;
    return contacts.filter(c => c.customerId === customerId);
  }, [contacts, customerId]);

  // Filtered opportunities for selected customer
  const availableOpportunities = useMemo(() => {
    if (!customerId) return opportunities;
    return opportunities.filter(o => o.customerId === customerId);
  }, [opportunities, customerId]);

  // Resolve target customer-facing email address
  const resolvedRecipientEmail = useMemo(() => {
    if (isAddingContact && newContactEmail.trim()) {
      return newContactEmail.trim();
    }
    if (contactId) {
      const con = contacts.find(c => c.id === contactId);
      if (con?.email && con.email.trim()) return con.email.trim();
    }
    if (customerId) {
      const cust = customers.find(c => c.id === customerId);
      if (cust?.primaryContact?.email && cust.primaryContact.email.trim()) {
        return cust.primaryContact.email.trim();
      }
    }
    return '';
  }, [contactId, customerId, contacts, customers, isAddingContact, newContactEmail]);

  const handleOpenAddOpp = () => {
    setIsAddingOpp(true);
    setOppError('');
    if (!newOppValue && financialTotals.grandTotal > 0) {
      setNewOppValue(financialTotals.grandTotal);
    }
  };

  const handleSaveNewOpportunity = async () => {
    if (!newOppName.trim()) {
      setOppError('Opportunity name is required');
      return;
    }
    if (!customerId) {
      setOppError('Please select a Customer Account first');
      return;
    }
    setIsSavingOpp(true);
    setOppError('');
    try {
      const selectedCust = customers.find(c => c.id === customerId);
      const val = typeof newOppValue === 'number' ? newOppValue : parseFloat(newOppValue as string) || financialTotals.grandTotal || 0;
      const createdId = await addOpportunity({
        name: newOppName.trim(),
        customerId,
        customerName: selectedCust?.customerName || 'Direct Account',
        value: val,
        probability: 70,
        expectedClose: validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        owner: owner || defaultOwnerName,
        stage: newOppStage || 'Proposal',
      });
      setOpportunityId(createdId);
      setIsAddingOpp(false);
      setNewOppName('');
      setNewOppValue('');
    } catch (err: any) {
      setOppError(err?.message || 'Failed to create opportunity');
    } finally {
      setIsSavingOpp(false);
    }
  };

  const handleOpenAddContact = () => {
    setIsAddingContact(true);
    setContactError('');
    const currentLead = leads.find(l => l.id === (leadId || quotationToEdit?.leadId));
    if (currentLead && !newContactName) {
      setNewContactName(currentLead.name || '');
      setNewContactEmail(currentLead.email || '');
      setNewContactPhone(currentLead.phone || '');
    }
  };

  const handleSaveNewContact = async () => {
    if (!newContactName.trim()) {
      setContactError('Contact name is required');
      return;
    }
    if (!newContactEmail.trim()) {
      setContactError('Contact email is required (for proposal delivery)');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newContactEmail.trim())) {
      setContactError('Please enter a valid email address');
      return;
    }
    if (!customerId) {
      setContactError('Please select a Customer Account first');
      return;
    }
    setIsSavingContact(true);
    setContactError('');
    try {
      const selectedCust = customers.find(c => c.id === customerId);
      const createdId = await addContact({
        name: newContactName.trim(),
        email: newContactEmail.trim().toLowerCase(),
        phone: newContactPhone.trim(),
        designation: newContactDesignation.trim() || 'Key Decision Maker',
        contactRole: newContactDesignation.trim() || 'Key Decision Maker',
        customerId,
        customerName: selectedCust?.customerName || 'Direct Account',
        leadId: leadId || quotationToEdit?.leadId || undefined,
        owner: owner || defaultOwnerName,
        status: 'Active',
      });
      setContactId(createdId);
      setIsAddingContact(false);
      setNewContactName('');
      setNewContactEmail('');
      setNewContactPhone('');
      setNewContactDesignation('');
    } catch (err: any) {
      setContactError(err?.message || 'Failed to create contact');
    } finally {
      setIsSavingContact(false);
    }
  };

  // Reset contact or opportunity if they no longer belong to selected customer
  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    
    // Check contact validity
    const validCons = contacts.filter(c => c.customerId === newCustId);
    if (!validCons.some(c => c.id === contactId)) {
      setContactId('');
    }

    // Check opportunity validity
    const validOpps = opportunities.filter(o => o.customerId === newCustId);
    if (!validOpps.some(o => o.id === opportunityId)) {
      setOpportunityId('');
    }
  };

  // Handle adding a new line item (catalog or custom)
  const handleAddItem = (initialMode: 'catalog' | 'custom' = 'catalog') => {
    const defaultProd = products[0];
    const newItem: QuotationItem = (initialMode === 'catalog' && defaultProd)
      ? {
          productId: defaultProd.id,
          productName: defaultProd.name,
          quantity: 1,
          unitPrice: defaultProd.price,
          taxRate: defaultProd.taxRate || 18,
          total: Math.round(defaultProd.price * (1 + (defaultProd.taxRate || 18) / 100)),
          mode: 'catalog',
          scope: '',
        }
      : {
          productName: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: 18,
          total: 0,
          mode: 'custom',
          scope: '',
        };
    setItems(prev => [...prev, newItem]);
  };

  // Switch between Catalog selection and Custom entry mode for a line item
  const handleModeSwitch = (index: number, newMode: 'catalog' | 'custom') => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], mode: newMode };
      if (newMode === 'catalog') {
        if (!item.productId) {
          const matched = products.find(p => p.name.toLowerCase() === (item.productName || '').trim().toLowerCase());
          if (matched) {
            item.productId = matched.id;
            item.productName = matched.name;
            item.unitPrice = matched.price;
            item.taxRate = matched.taxRate || 18;
          } else if (products.length > 0) {
            const p = products[0];
            item.productId = p.id;
            item.productName = p.name;
            item.unitPrice = p.price;
            item.taxRate = p.taxRate || 18;
          }
        }
      } else {
        item.productId = '';
      }

      const qty = Math.max(0, parseFloat(item.quantity as any) || 0);
      const price = Math.max(0, parseFloat(item.unitPrice as any) || 0);
      const tax = Math.min(100, Math.max(0, parseFloat(item.taxRate as any) || 0));
      const lineSubtotal = round2(qty * price);
      const lineTax = round2(lineSubtotal * (tax / 100));
      item.total = round2(lineSubtotal + lineTax);

      updated[index] = item;
      return updated;
    });
  };

  // Handle selecting a catalog item
  const handleCatalogSelect = (index: number, prodId: string) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], productId: prodId, mode: 'catalog' as const };
      if (prodId) {
        const prod = products.find(p => p.id === prodId);
        if (prod) {
          item.productName = prod.name;
          item.unitPrice = prod.price;
          item.taxRate = prod.taxRate || 18;

          const qty = Math.max(0, parseFloat(item.quantity as any) || 0);
          const price = prod.price;
          const tax = prod.taxRate || 18;
          const lineSubtotal = round2(qty * price);
          const lineTax = round2(lineSubtotal * (tax / 100));
          item.total = round2(lineSubtotal + lineTax);
        }
      } else {
        item.productId = '';
      }
      updated[index] = item;
      return updated;
    });
  };

  // Handle typing a custom product or service name (with catalog suggestion match support)
  const handleCustomNameChange = (index: number, val: string) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], productName: val, mode: 'custom' as const };

      const matched = products.find(p => p.name.toLowerCase() === val.trim().toLowerCase());
      if (matched) {
        item.productId = matched.id;
        item.unitPrice = matched.price;
        item.taxRate = matched.taxRate || 18;

        const qty = Math.max(0, parseFloat(item.quantity as any) || 0);
        const lineSubtotal = round2(qty * matched.price);
        const lineTax = round2(lineSubtotal * ((matched.taxRate || 18) / 100));
        item.total = round2(lineSubtotal + lineTax);
      } else {
        item.productId = '';
      }

      updated[index] = item;
      return updated;
    });
  };

  // Handle removing a line item
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Handle updating line item field
  const handleItemChange = (index: number, field: keyof QuotationItem, val: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };

      if (field === 'productId') {
        if (val) {
          const prod = products.find(p => p.id === val);
          if (prod) {
            item.productName = prod.name;
            item.unitPrice = prod.price;
            item.taxRate = prod.taxRate || 18;
          }
        }
      }

      const qty = Math.max(0, parseFloat(item.quantity as any) || 0);
      const price = Math.max(0, parseFloat(item.unitPrice as any) || 0);
      const tax = Math.min(100, Math.max(0, parseFloat(item.taxRate as any) || 0));
      
      item.quantity = qty;
      item.unitPrice = price;
      item.taxRate = tax;

      const lineSubtotal = round2(qty * price);
      const lineTax = round2(lineSubtotal * (tax / 100));
      item.total = round2(lineSubtotal + lineTax);

      updated[index] = item;
      return updated;
    });
  };

  // Compute subtotal, tax, discount, grand total with 2 decimal precision
  const financialTotals = useMemo(() => {
    const subtotal = round2(
      items.reduce((sum, item) => {
        const qty = Math.max(0, parseFloat(item.quantity as any) || 0);
        const price = Math.max(0, parseFloat(item.unitPrice as any) || 0);
        return sum + (qty * price);
      }, 0)
    );

    const safeDiscountPercent = Math.min(100, Math.max(0, parseFloat(overallDiscountPercent as any) || 0));
    const discountAmount = round2(subtotal * (safeDiscountPercent / 100));
    const taxableSubtotal = Math.max(0, round2(subtotal - discountAmount));

    const taxAmount = round2(
      items.reduce((sum, item) => {
        const qty = Math.max(0, parseFloat(item.quantity as any) || 0);
        const price = Math.max(0, parseFloat(item.unitPrice as any) || 0);
        const itemRatio = subtotal > 0 ? (qty * price) / subtotal : 0;
        const discountedItemBase = taxableSubtotal * itemRatio;
        const taxRate = Math.min(100, Math.max(0, parseFloat(item.taxRate as any) || 0));
        return sum + (discountedItemBase * (taxRate / 100));
      }, 0)
    );

    const grandTotal = round2(taxableSubtotal + taxAmount);

    return {
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
    };
  }, [items, overallDiscountPercent]);

  // Form Validation
  const validateForm = (): string | null => {
    if (!customerId) return 'Please select a Customer Account.';
    if (!date) return 'Please select a Quotation Date.';
    if (!validUntil) return 'Please select a Valid Until date.';

    const quotationTime = new Date(date).getTime();
    const validUntilTime = new Date(validUntil).getTime();
    if (!isNaN(quotationTime) && !isNaN(validUntilTime) && validUntilTime < quotationTime) {
      return 'Valid Until date cannot be earlier than the Quotation Date.';
    }

    if (!items || items.length === 0) {
      return 'Quotation must have at least one line item.';
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productName || !it.productName.trim()) {
        return `Line item #${i + 1} requires a product/service name or description.`;
      }
      if (!it.quantity || it.quantity <= 0) {
        return `Line item #${i + 1} must have a quantity greater than zero.`;
      }
      if (it.unitPrice === undefined || it.unitPrice === null || isNaN(it.unitPrice) || it.unitPrice < 0) {
        return `Line item #${i + 1} unit price cannot be negative.`;
      }
      if (it.taxRate === undefined || it.taxRate === null || isNaN(it.taxRate) || it.taxRate < 0 || it.taxRate > 100) {
        return `Line item #${i + 1} GST tax rate must be between 0% and 100%.`;
      }
    }

    if (isNaN(overallDiscountPercent) || overallDiscountPercent < 0 || overallDiscountPercent > 100) {
      return 'Special Discount percentage must be between 0% and 100%.';
    }

    return null;
  };

  // Submit Handler supporting Save Draft & Send Quotation
  const executeSubmit = async (targetStatus?: 'Draft' | 'Sent') => {
    if (isSubmittingRef.current || isSubmitting) return;

    let activeOppId = opportunityId;
    let activeContactId = contactId;

    // Auto-persist new opportunity if user typed inline details
    if (isAddingOpp && newOppName.trim() && customerId) {
      try {
        const selectedCust = customers.find(c => c.id === customerId);
        const val = typeof newOppValue === 'number' ? newOppValue : parseFloat(newOppValue as string) || financialTotals.grandTotal || 0;
        activeOppId = await addOpportunity({
          name: newOppName.trim(),
          customerId,
          customerName: selectedCust?.customerName || 'Direct Account',
          value: val,
          probability: 70,
          expectedClose: validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          owner: owner || defaultOwnerName,
          stage: newOppStage || 'Proposal',
        });
        setOpportunityId(activeOppId);
        setIsAddingOpp(false);
      } catch (e) {
        console.warn('Auto-saving new opportunity failed:', e);
      }
    }

    // Auto-persist new contact if user typed inline details
    if (isAddingContact && newContactName.trim() && newContactEmail.trim() && customerId) {
      try {
        const selectedCust = customers.find(c => c.id === customerId);
        activeContactId = await addContact({
          name: newContactName.trim(),
          email: newContactEmail.trim().toLowerCase(),
          phone: newContactPhone.trim(),
          designation: newContactDesignation.trim() || 'Key Decision Maker',
          contactRole: newContactDesignation.trim() || 'Key Decision Maker',
          customerId,
          customerName: selectedCust?.customerName || 'Direct Account',
          leadId: leadId || quotationToEdit?.leadId || undefined,
          owner: owner || defaultOwnerName,
          status: 'Active',
        });
        setContactId(activeContactId);
        setIsAddingContact(false);
      } catch (e) {
        console.warn('Auto-saving new contact failed:', e);
      }
    }

    const error = validateForm();
    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage('');
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const cust = customers.find(c => c.id === customerId);
      const customerName = cust ? cust.customerName : 'Direct Corporate Account';

      const sanitizedItems = items.map(it => {
        let finalName = (it.productName || '').trim();
        const scopeTrimmed = (it.scope || '').trim();
        if (scopeTrimmed && !finalName.includes(scopeTrimmed)) {
          finalName = `${finalName} — ${scopeTrimmed}`;
        }
        return {
          ...it,
          productName: finalName || 'Product / Service Item',
        };
      });

      if (targetStatus === 'Sent' && !resolvedRecipientEmail) {
        setErrorMessage('Cannot send quotation: No valid recipient email address found. Please select a contact with an email or ensure customer account has an email address.');
        return;
      }

      if (isRevisionMode && quotationToEdit) {
        // Revision workflow: mark previous version as 'Revised' and create NEW revision
        if (quotationToEdit.status === 'Sent') {
          await updateQuotation(quotationToEdit.id, { status: 'Revised' });
        }

        const nextRev = (quotationToEdit.revisionNumber || 1) + 1;
        const todayStr = new Date().toISOString().split('T')[0];

        const created = await addQuotation({
          quoteNumber: quotationToEdit.quoteNumber || `QT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
          customerId: customerId || quotationToEdit.customerId || 'CUST-001',
          customerName: customerName || quotationToEdit.customerName || 'Direct Corporate Account',
          leadId: quotationToEdit.leadId,
          opportunityId: activeOppId || quotationToEdit.opportunityId,
          contactId: activeContactId || quotationToEdit.contactId,
          date: date || todayStr,
          validUntil: validUntil || quotationToEdit.validUntil,
          amount: financialTotals.grandTotal,
          subtotal: financialTotals.subtotal,
          taxAmount: financialTotals.taxAmount,
          discountAmount: financialTotals.discountAmount,
          status: 'Draft',
          revisionNumber: nextRev,
          revisionGroupId: quotationToEdit.revisionGroupId || quotationToEdit.id,
          terms,
          notes,
          owner: owner || defaultOwnerName,
          items: sanitizedItems,
          itemsCount: sanitizedItems.length,
        });

        if (targetStatus === 'Sent' && created?.id) {
          await sendQuotation(created.id, { recipientEmail: resolvedRecipientEmail });
        }
      } else if (quotationToEdit) {
        // Direct edit
        await updateQuotation(quotationToEdit.id, {
          customerId,
          customerName,
          leadId: leadId || quotationToEdit.leadId || undefined,
          opportunityId: activeOppId || undefined,
          contactId: activeContactId || undefined,
          date,
          validUntil,
          amount: financialTotals.grandTotal,
          subtotal: financialTotals.subtotal,
          taxAmount: financialTotals.taxAmount,
          discountAmount: financialTotals.discountAmount,
          terms,
          notes,
          owner: owner || defaultOwnerName,
          items: sanitizedItems,
          itemsCount: sanitizedItems.length,
        });

        if (targetStatus === 'Sent') {
          await sendQuotation(quotationToEdit.id, { recipientEmail: resolvedRecipientEmail });
        }
      } else {
        // New creation
        const quoteNo = `QT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`;
        const todayStr = new Date().toISOString().split('T')[0];
        
        const payload: Omit<Quotation, 'id'> = {
          quoteNumber: quoteNo,
          customerId: customerId || 'CUST-001',
          customerName,
          leadId: leadId || undefined,
          opportunityId: activeOppId || undefined,
          contactId: activeContactId || undefined,
          date: date || todayStr,
          validUntil: validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          amount: financialTotals.grandTotal,
          subtotal: financialTotals.subtotal,
          taxAmount: financialTotals.taxAmount,
          discountAmount: financialTotals.discountAmount,
          status: 'Draft',
          itemsCount: items.length,
          revisionNumber: 1,
          terms,
          notes,
          owner: owner || defaultOwnerName,
          items: sanitizedItems,
        };

        const created = await addQuotation(payload);
        if (targetStatus === 'Sent' && created?.id) {
          await sendQuotation(created.id, { recipientEmail: resolvedRecipientEmail });
        }
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save or send quotation. Please verify inputs and try again.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-start shrink-0 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {isRevisionMode ? `Revise Quotation (${quotationToEdit?.quoteNumber})` : quotationToEdit ? `Edit Quotation (${quotationToEdit.quoteNumber})` : 'Create Commercial Quotation'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {isRevisionMode ? `Revision #${(quotationToEdit?.revisionNumber || 1) + 1}` : quotationToEdit?.status || 'Draft'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify products, services, GST pricing, payment terms, and validity for the customer proposal.
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto grow">
          
          {/* Error Alert Display */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* CRM Qualified Lead Integration Banner / Selector */}
          {!quotationToEdit ? (
            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-indigo-900 font-semibold">
                  <User size={14} className="text-indigo-600" />
                  <span>Link to CRM Qualified Lead (Optional)</span>
                </div>
                <div className="w-full sm:w-72">
                  <select
                    id="quote-lead-selector"
                    value={leadId}
                    onChange={(e) => handleLeadSelect(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full border border-indigo-200 rounded-md px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">— Standalone / Direct Quotation —</option>
                    {eligibleLeads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} — {l.company} ({l.stage})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {leadId && (
                <div className="mt-2 pt-2 border-t border-indigo-200/50 text-[11px] text-indigo-800 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Linked Lead: <strong>{leads.find(l => l.id === leadId)?.name}</strong></span>
                  <span>Company: <strong>{leads.find(l => l.id === leadId)?.company}</strong></span>
                  <span className="text-emerald-700 font-medium">✓ Quotation acceptance will automatically mark Lead as Won in CRM</span>
                </div>
              )}
            </div>
          ) : (quotationToEdit.leadId || leadId) ? (
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={14} className="text-indigo-600 shrink-0" />
                <span>
                  Linked to CRM Lead: <strong>{leads.find(l => l.id === (quotationToEdit.leadId || leadId))?.name || (quotationToEdit.leadId || leadId)}</strong>
                  {leads.find(l => l.id === (quotationToEdit.leadId || leadId))?.company ? ` (${leads.find(l => l.id === (quotationToEdit.leadId || leadId))?.company})` : ''}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                CRM Linked
              </span>
            </div>
          ) : null}

          {/* Row 1: Customer Account, Linked Opportunity, Contact Person */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* Customer Account */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Building2 size={13} className="text-slate-400" /> Customer Account <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                disabled={Boolean(quotationToEdit) || isSubmitting}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none disabled:bg-slate-50"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.customerName}</option>
                ))}
              </select>
            </div>

            {/* Linked Opportunity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <Tag size={13} className="text-slate-400" /> Linked Opportunity
                </label>
                <button
                  type="button"
                  onClick={isAddingOpp ? () => setIsAddingOpp(false) : handleOpenAddOpp}
                  disabled={isSubmitting}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5"
                >
                  {isAddingOpp ? '← Select Existing' : '+ Add New'}
                </button>
              </div>

              {!isAddingOpp ? (
                <select
                  value={opportunityId}
                  onChange={(e) => {
                    if (e.target.value === '__ADD_NEW__') {
                      handleOpenAddOpp();
                    } else {
                      setOpportunityId(e.target.value);
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">— None / Direct Quote —</option>
                  {availableOpportunities.map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({formatINR(o.value)})</option>
                  ))}
                  <option value="__ADD_NEW__" className="text-blue-600 font-semibold bg-blue-50">+ Add New Opportunity...</option>
                </select>
              ) : (
                <div className="bg-slate-50 border border-blue-200 rounded-lg p-2.5 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px] text-blue-900 flex items-center gap-1">
                      <Plus size={11} className="text-blue-600" /> Add Opportunity Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingOpp(false)}
                      className="text-slate-400 hover:text-slate-600"
                      title="Cancel"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Opportunity Name *"
                      value={newOppName}
                      onChange={(e) => { setNewOppName(e.target.value); setOppError(''); }}
                      className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      autoFocus
                    />
                    {oppError && <p className="text-[10px] text-rose-500 mt-0.5">{oppError}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <input
                        type="number"
                        placeholder="Est. Value (₹)"
                        value={newOppValue}
                        onChange={(e) => setNewOppValue(e.target.value)}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <select
                        value={newOppStage}
                        onChange={(e: any) => setNewOppStage(e.target.value)}
                        className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Proposal">Proposal</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="New">New</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingOpp(false)}
                      className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewOpportunity}
                      disabled={isSavingOpp}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      {isSavingOpp ? <Loader2 size={11} className="animate-spin" /> : null}
                      Add & Select
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <User size={13} className="text-slate-400" /> Contact Person
                </label>
                <button
                  type="button"
                  onClick={isAddingContact ? () => setIsAddingContact(false) : handleOpenAddContact}
                  disabled={isSubmitting}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5"
                >
                  {isAddingContact ? '← Select Existing' : '+ Add New'}
                </button>
              </div>

              {!isAddingContact ? (
                <select
                  value={contactId}
                  onChange={(e) => {
                    if (e.target.value === '__ADD_NEW__') {
                      handleOpenAddContact();
                    } else {
                      setContactId(e.target.value);
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">— Primary Customer Contact —</option>
                  {availableContacts.map(con => (
                    <option key={con.id} value={con.id}>{con.name} ({con.designation || con.contactRole})</option>
                  ))}
                  <option value="__ADD_NEW__" className="text-blue-600 font-semibold bg-blue-50">+ Add New Contact Person...</option>
                </select>
              ) : (
                <div className="bg-slate-50 border border-blue-200 rounded-lg p-2.5 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px] text-blue-900 flex items-center gap-1">
                      <Plus size={11} className="text-blue-600" /> Add Contact Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingContact(false)}
                      className="text-slate-400 hover:text-slate-600"
                      title="Cancel"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Contact Name *"
                      value={newContactName}
                      onChange={(e) => { setNewContactName(e.target.value); setContactError(''); }}
                      className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      autoFocus
                    />
                    {contactError && <p className="text-[10px] text-rose-500 mt-0.5">{contactError}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address * (for quote delivery)"
                      value={newContactEmail}
                      onChange={(e) => { setNewContactEmail(e.target.value); setContactError(''); }}
                      className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Designation / Role"
                        value={newContactDesignation}
                        onChange={(e) => setNewContactDesignation(e.target.value)}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingContact(false)}
                      className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewContact}
                      disabled={isSavingContact}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 shadow-xs disabled:opacity-50"
                    >
                      {isSavingContact ? <Loader2 size={11} className="animate-spin" /> : null}
                      Add & Select
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recipient Email Delivery Preview Banner */}
          <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${resolvedRecipientEmail ? 'bg-blue-50/70 border-blue-200 text-blue-900' : 'bg-amber-50/80 border-amber-200 text-amber-900'}`}>
            <div className="flex items-center gap-2">
              <Mail size={14} className={resolvedRecipientEmail ? 'text-blue-600 shrink-0' : 'text-amber-600 shrink-0'} />
              <span>
                {resolvedRecipientEmail ? (
                  <>Customer proposal will be delivered to: <strong className="font-semibold">{resolvedRecipientEmail}</strong></>
                ) : (
                  <>No recipient email resolved for this customer/contact. Please assign a contact with an email before sending.</>
                )}
              </span>
            </div>
            {resolvedRecipientEmail && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded">
                Verified Recipient
              </span>
            )}
          </div>

          {/* Row 2: Quotation Date, Valid Until, Sales Representative */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-slate-400" /> Quotation Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-slate-400" /> Valid Until <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                disabled={isSubmitting}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1 flex items-center gap-1">
                <User size={13} className="text-slate-400" /> Sales Representative
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                disabled={isSubmitting}
                placeholder="Assigned Sales Representative"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Products & Services Line Items ({items.length}) <span className="text-rose-500">*</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select predefined items from your catalog or enter custom products with project-specific scope of work.
                </p>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleAddItem('catalog')}
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                >
                  <Plus size={13} /> Add Catalog Item
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('custom')}
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                >
                  <Plus size={13} /> Enter Custom Item
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 text-[11px] font-semibold uppercase">
                    <th className="py-2.5 px-3 min-w-[320px]">Product / Service & Scope</th>
                    <th className="py-2.5 px-2 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-2 w-28 text-right">Unit Price (₹)</th>
                    <th className="py-2.5 px-2 w-20 text-center">GST (%)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Line Total (₹)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const currentMode = item.mode || (item.productId ? 'catalog' : 'custom');
                    return (
                      <tr key={idx} className="bg-white hover:bg-slate-50/50 transition">
                        <td className="p-2.5 align-top">
                          <div className="space-y-1.5">
                            {/* Mode Toggle Controls */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Line #{idx + 1}
                              </span>
                              <div className="inline-flex rounded-md p-0.5 bg-slate-100 border border-slate-200 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => handleModeSwitch(idx, 'catalog')}
                                  disabled={isSubmitting}
                                  className={`px-2 py-0.5 rounded font-semibold transition ${
                                    currentMode === 'catalog'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                  title="Select from product catalog"
                                >
                                  Select Catalog
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleModeSwitch(idx, 'custom')}
                                  disabled={isSubmitting}
                                  className={`px-2 py-0.5 rounded font-semibold transition ${
                                    currentMode === 'custom'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                  title="Enter custom product or service scope"
                                >
                                  Enter Custom
                                </button>
                              </div>
                            </div>

                            {/* Catalog Selection Mode */}
                            {currentMode === 'catalog' ? (
                              <div className="space-y-1.5">
                                <select
                                  value={item.productId || ''}
                                  onChange={(e) => handleCatalogSelect(idx, e.target.value)}
                                  disabled={isSubmitting}
                                  className="w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-xs bg-white text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">— Select Catalog Product / Service —</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} {p.sku ? `(${p.sku})` : ''} - {formatINR(p.price)}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  placeholder="Scope / Custom specifications (e.g. includes 1-year SLA, onboarding)..."
                                  value={item.scope || ''}
                                  onChange={(e) => handleItemChange(idx, 'scope', e.target.value)}
                                  disabled={isSubmitting}
                                  className="w-full border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            ) : (
                              /* Custom Entry Mode */
                              <div className="space-y-1.5">
                                <div className="relative">
                                  <input
                                    type="text"
                                    required
                                    list={`catalog-suggestions-${idx}`}
                                    placeholder="Enter custom product or service name..."
                                    value={item.productName}
                                    onChange={(e) => handleCustomNameChange(idx, e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <datalist id={`catalog-suggestions-${idx}`}>
                                    {products.map(p => (
                                      <option key={p.id} value={p.name}>
                                        {p.sku ? `${p.sku} • ` : ''}{formatINR(p.price)}
                                      </option>
                                    ))}
                                  </datalist>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Enter scope of work / service specifications..."
                                  value={item.scope || ''}
                                  onChange={(e) => handleItemChange(idx, 'scope', e.target.value)}
                                  disabled={isSubmitting}
                                  className="w-full border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                          disabled={isSubmitting}
                          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs text-center font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          disabled={isSubmitting}
                          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs text-right font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                          disabled={isSubmitting}
                          className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs text-center font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900 text-xs">
                        {formatINR(item.total)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1 || isSubmitting}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 transition p-1 rounded hover:bg-slate-100"
                          title="Remove Line Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 3: Commercial Terms & Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Commercial Terms & Conditions (Customer-facing)</label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Specify payment terms, validity, delivery timelines..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Internal Notes & Remarks <span className="font-normal text-slate-400">(Internal use only)</span></label>
                <input
                  type="text"
                  placeholder="Special client requirements or revision reason"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal (Base Price):</span>
                <span className="font-semibold text-slate-900">{formatINR(financialTotals.subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span>Special Discount (Applied before GST):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={overallDiscountPercent}
                    onChange={(e) => setOverallDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    disabled={isSubmitting}
                    className="w-12 border border-slate-200 rounded px-1 py-0.5 text-center text-xs bg-white font-medium text-slate-800"
                  />
                  <span>%</span>
                </div>
                <span className="font-semibold text-rose-600">- {formatINR(financialTotals.discountAmount)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Estimated Taxes (GST):</span>
                <span className="font-semibold text-slate-900">{formatINR(financialTotals.taxAmount)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900">Grand Total (Payable):</span>
                <span className="text-base font-bold text-blue-600">{formatINR(financialTotals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center shrink-0 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition disabled:opacity-50"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!isRevisionMode && !quotationToEdit && (
              <button
                type="button"
                onClick={() => executeSubmit('Draft')}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="text-slate-500" />}
                Save as Draft
              </button>
            )}

            {!isRevisionMode && quotationToEdit && quotationToEdit.status === 'Draft' && (
              <button
                type="button"
                onClick={() => executeSubmit('Draft')}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="text-slate-500" />}
                Save Draft
              </button>
            )}

            <button
              type="button"
              onClick={() => executeSubmit(quotationToEdit && quotationToEdit.status !== 'Draft' ? (quotationToEdit.status === 'Sent' ? 'Sent' : undefined) : 'Sent')}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : isRevisionMode ? (
                'Confirm & Save Revision'
              ) : quotationToEdit && quotationToEdit.status !== 'Draft' ? (
                'Save Changes'
              ) : (
                <>
                  <Send size={14} />
                  Send Quotation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
