/**
 * GST Utilities for Indian Tax Compliant Invoicing
 */

export interface GstState {
  code: string;
  name: string;
}

export const SELLER_COMPANY_INFO = {
  name: 'Demo Company Pvt. Ltd.',
  tradeName: 'ERP & HRMS Suite Global',
  address: 'Level 5, Tech Innovation Park, Bengaluru, Karnataka 560100, India',
  city: 'Bengaluru',
  state: 'Karnataka',
  stateCode: '29',
  gstin: '29AABCU9603R1ZM',
  pan: 'AABCU9603R',
  cin: 'U72200KA2020PTC138842',
  email: 'corporate@democompany.com',
  phone: '+91 80 4123 4567',
  website: 'https://democompany.com',
};

export const INDIAN_STATES_GST: GstState[] = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh (Old)' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' },
];

/**
 * Validate GSTIN format
 * Standard 15-character format: 2 digits (state) + 10 alphanumeric (PAN) + 1 digit (entity) + 'Z' + 1 checksum
 */
export const validateGSTIN = (gstin?: string | null): { valid: boolean; stateCode?: string; message?: string } => {
  if (!gstin || !gstin.trim()) {
    return { valid: true, message: 'Unregistered or Consumer (No GSTIN)' };
  }
  const clean = gstin.trim().toUpperCase();
  if (clean === 'UNREGISTERED' || clean === 'CONSUMER' || clean === 'N/A') {
    return { valid: true, message: 'Unregistered entity' };
  }
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(clean)) {
    return { 
      valid: false, 
      message: 'Invalid GSTIN format. Expected 15 characters (e.g. 29AABCU9603R1ZM).' 
    };
  }
  const stateCode = clean.substring(0, 2);
  const matchedState = INDIAN_STATES_GST.find(s => s.code === stateCode);
  if (!matchedState) {
    return { valid: false, stateCode, message: `Unknown state code ${stateCode} in GSTIN.` };
  }
  return { valid: true, stateCode, message: `Valid GSTIN for ${matchedState.name}` };
};

/**
 * Convert number to words in Indian Numbering System
 */
export const numberToIndianWords = (amount: number): string => {
  if (isNaN(amount) || amount === 0) return 'Zero Rupees Only';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertGroup = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += single[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      str += double[n - 10] + ' ';
      n = 0;
    }
    if (n > 0) {
      str += single[n] + ' ';
    }
    return str.trim();
  };

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  let num = integerPart;
  let words = '';

  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  const thousands = Math.floor(num / 1000);
  num %= 1000;
  const remainder = num;

  if (crores > 0) words += convertGroup(crores) + ' Crore ';
  if (lakhs > 0) words += convertGroup(lakhs) + ' Lakh ';
  if (thousands > 0) words += convertGroup(thousands) + ' Thousand ';
  if (remainder > 0) words += convertGroup(remainder) + ' ';

  words = words.trim() + ' Rupees';

  if (decimalPart > 0) {
    words += ' and ' + convertGroup(decimalPart) + ' Paise';
  }

  return words.trim() + ' Only';
};

/**
 * Calculate GST Breakdown based on place of supply and seller state
 */
export const calculateGstTaxBreakdown = (params: {
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  placeOfSupplyCode: string;
  sellerStateCode?: string;
  taxRatePercent?: number;
}) => {
  const {
    subtotal,
    discountAmount = 0,
    taxAmount = 0,
    placeOfSupplyCode,
    sellerStateCode = '29',
    taxRatePercent = 18
  } = params;

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const isInterState = placeOfSupplyCode !== sellerStateCode;
  const taxType: 'INTRA_STATE' | 'INTER_STATE' = isInterState ? 'INTER_STATE' : 'INTRA_STATE';

  // Compute tax total
  const calculatedTax = taxAmount > 0 
    ? taxAmount 
    : Math.round((taxableAmount * (taxRatePercent / 100)) * 100) / 100;

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstRate = taxRatePercent;
    igstAmount = calculatedTax;
  } else {
    cgstRate = taxRatePercent / 2;
    sgstRate = taxRatePercent / 2;
    cgstAmount = Math.round((calculatedTax / 2) * 100) / 100;
    sgstAmount = Math.round((calculatedTax - cgstAmount) * 100) / 100;
  }

  const grandTotal = Math.round((taxableAmount + calculatedTax) * 100) / 100;

  return {
    taxType,
    isInterState,
    taxableAmount,
    totalTax: calculatedTax,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    grandTotal
  };
};

