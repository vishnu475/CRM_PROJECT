import { Customer, Lead, Contact } from '../../../types';

export interface DuplicateCustomerMatch {
  hasDuplicate: boolean;
  matchingCustomer: Customer | null;
  matchField?: 'taxId' | 'email' | 'website' | 'phone';
  matchReason?: string;
  matchedValue?: string;
}

/**
 * Normalizes a URL/domain string to its root hostname for domain comparison.
 * e.g., "https://www.apexcloud.io/about" -> "apexcloud.io"
 */
export function normalizeDomain(url?: string): string {
  if (!url) return '';
  let clean = url.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//, '');
  clean = clean.replace(/^www\./, '');
  clean = clean.split('/')[0];
  clean = clean.split('?')[0];
  clean = clean.split(':')[0];
  return clean.trim();
}

/**
 * Normalizes phone numbers to digits only (last 10 digits for matching).
 */
export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Generic public email domains to ignore when matching websites/domains.
 */
const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'aol.com', 'mail.com', 'zoho.com', 'protonmail.com'
]);

/**
 * Checks if a Lead (or custom conversion input) matches an existing Customer
 * based on strong identifiers in priority order:
 * 1. GST / Tax / VAT ID
 * 2. Primary Contact Email
 * 3. Website / Domain
 * 4. Phone Number
 */
export function findMatchingCustomer(
  lead: Lead,
  customers: Customer[],
  customData?: {
    customerName?: string;
    contactEmail?: string;
    website?: string;
    contactPhone?: string;
    taxId?: string;
  }
): DuplicateCustomerMatch {
  if (!customers || customers.length === 0 || !lead) {
    return { hasDuplicate: false, matchingCustomer: null };
  }

  const leadTaxId = (customData?.taxId || (lead as any).taxId || (lead as any).gstVatNumber || (lead as any).gstin || '').trim().toUpperCase();
  const leadEmail = (customData?.contactEmail || lead.email || '').trim().toLowerCase();
  const leadWebsite = (customData?.website || lead.website || '').trim();
  const leadPhone = normalizePhone(customData?.contactPhone || lead.phone);

  const leadDomain = normalizeDomain(leadWebsite);
  const leadEmailDomain = leadEmail.includes('@') ? leadEmail.split('@')[1] : '';

  for (const customer of customers) {
    // 1. GST / VAT / Tax ID Match (Priority 1)
    if (leadTaxId) {
      const custTax = ((customer as any).taxId || (customer as any).gstVatNumber || (customer as any).tax_id || '').trim().toUpperCase();
      if (custTax && custTax === leadTaxId) {
        return {
          hasDuplicate: true,
          matchingCustomer: customer,
          matchField: 'taxId',
          matchReason: `Tax / GST ID matched (${custTax})`,
          matchedValue: custTax,
        };
      }
    }

    // 2. Email Address Match (Priority 2)
    if (leadEmail) {
      const custEmail = (
        customer.primaryContact?.email ||
        (customer as any).contact_email ||
        (customer as any).email ||
        ''
      ).trim().toLowerCase();

      if (custEmail && custEmail === leadEmail) {
        return {
          hasDuplicate: true,
          matchingCustomer: customer,
          matchField: 'email',
          matchReason: `Primary contact email matched (${custEmail})`,
          matchedValue: custEmail,
        };
      }
    }

    // 3. Website / Domain Match (Priority 3)
    if (leadDomain && leadDomain.length > 3) {
      const custWebsite = (customer.website || (customer as any).domain || '').trim();
      const custDomain = normalizeDomain(custWebsite);
      const custEmail = (customer.primaryContact?.email || (customer as any).contact_email || '').trim().toLowerCase();
      const custEmailDomain = custEmail.includes('@') ? custEmail.split('@')[1] : '';

      if (custDomain && custDomain === leadDomain) {
        return {
          hasDuplicate: true,
          matchingCustomer: customer,
          matchField: 'website',
          matchReason: `Website domain matched (${leadDomain})`,
          matchedValue: leadDomain,
        };
      }

      // Check if lead domain matches customer contact's company domain (non-public domain)
      if (
        custEmailDomain &&
        !PUBLIC_EMAIL_DOMAINS.has(custEmailDomain) &&
        custEmailDomain === leadDomain
      ) {
        return {
          hasDuplicate: true,
          matchingCustomer: customer,
          matchField: 'website',
          matchReason: `Company domain matched customer contact (${custEmailDomain})`,
          matchedValue: custEmailDomain,
        };
      }
    }

    // Also check if lead email domain matches customer website domain (non-public domain)
    if (
      leadEmailDomain &&
      !PUBLIC_EMAIL_DOMAINS.has(leadEmailDomain)
    ) {
      const custWebsite = (customer.website || '').trim();
      const custDomain = normalizeDomain(custWebsite);
      if (custDomain && custDomain === leadEmailDomain) {
        return {
          hasDuplicate: true,
          matchingCustomer: customer,
          matchField: 'website',
          matchReason: `Lead email domain matches customer website (${custDomain})`,
          matchedValue: custDomain,
        };
      }
    }

    // Check if lead corporate email domain matches customer contact corporate email domain
    const custContactEmail = (customer.primaryContact?.email || (customer as any).contact_email || (customer as any).contactEmail || (customer as any).email || '').trim().toLowerCase();
    const custContactEmailDomain = custContactEmail.includes('@') ? custContactEmail.split('@')[1] : '';
    if (
      leadEmailDomain &&
      custContactEmailDomain &&
      !PUBLIC_EMAIL_DOMAINS.has(leadEmailDomain) &&
      leadEmailDomain === custContactEmailDomain
    ) {
      return {
        hasDuplicate: true,
        matchingCustomer: customer,
        matchField: 'email',
        matchReason: `Corporate email domain matched (${leadEmailDomain})`,
        matchedValue: leadEmailDomain,
      };
    }

    // 4. Phone Number Match (Priority 4)
    if (leadPhone && leadPhone.length >= 10) {
      const custPhone = normalizePhone(
        customer.primaryContact?.phone ||
        (customer as any).contact_phone ||
        (customer as any).phone
      );
      if (custPhone && custPhone === leadPhone) {
        return {
          hasDuplicate: true,
          matchingCustomer: customer,
          matchField: 'phone',
          matchReason: `Phone number matched (${customer.primaryContact?.phone || custPhone})`,
          matchedValue: customer.primaryContact?.phone || custPhone,
        };
      }
    }
  }

  return { hasDuplicate: false, matchingCustomer: null };
}

/**
 * Checks if a contact already exists for a given lead or customer based on leadId, convertedToContactId, email, phone, or name.
 */
export function findMatchingContact(
  lead: Lead,
  contacts: Contact[],
  customerId?: string,
  customData?: {
    contactEmail?: string;
    contactPhone?: string;
    contactName?: string;
  }
): Contact | null {
  if (!contacts || contacts.length === 0 || !lead) return null;

  // 1. Direct Lead ID or convertedToContactId Match (Top Priority)
  if (lead.convertedToContactId) {
    const directMatch = contacts.find((c) => c.id === lead.convertedToContactId);
    if (directMatch) return directMatch;
  }
  if (lead.id) {
    const leadContact = contacts.find((c) => c.leadId === lead.id);
    if (leadContact) return leadContact;
  }

  const leadEmail = (customData?.contactEmail || lead.email || '').trim().toLowerCase();
  const leadPhone = normalizePhone(customData?.contactPhone || lead.phone);
  const leadName = (customData?.contactName || lead.decisionMaker || lead.contactPerson || lead.name || '').trim().toLowerCase();

  // If customerId is provided, filter or prioritize customer contacts
  const candidateContacts = customerId 
    ? contacts.filter((c) => c.customerId === customerId || !c.customerId || c.leadId === lead.id) 
    : contacts;

  // Match by email first
  if (leadEmail) {
    const emailMatch = candidateContacts.find(
      (c) => (c.email || '').trim().toLowerCase() === leadEmail
    );
    if (emailMatch) return emailMatch;
  }

  // Match by phone next
  if (leadPhone && leadPhone.length >= 10) {
    const phoneMatch = candidateContacts.find(
      (c) => normalizePhone(c.phone) === leadPhone
    );
    if (phoneMatch) return phoneMatch;
  }

  // Match by exact full name for that customer as fallback
  if (leadName) {
    const nameMatch = candidateContacts.find(
      (c) => (c.name || '').trim().toLowerCase() === leadName && (customerId ? (c.customerId === customerId || !c.customerId) : true)
    );
    if (nameMatch) return nameMatch;
  }

  return null;
}
