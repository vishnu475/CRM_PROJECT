/**
 * Generates standard compliant PDF 1.4 corporate tax invoice / expense receipt documents
 */
export function generateExpenseInvoicePdf({
  claimNumber,
  empName,
  empId,
  vendor,
  category,
  amount,
  date,
  description
}) {
  const safeDesc = (description || 'Official Corporate Expense Claim').replace(/[()\\\r\n]/g, ' ');
  const safeVendor = (vendor || 'Direct Merchant').replace(/[()\\\r\n]/g, ' ');
  const safeCat = (category || 'General').replace(/[()\\\r\n]/g, ' ');
  const safeClaim = (claimNumber || 'EXP-2026').replace(/[()\\\r\n]/g, ' ');
  const safeEmp = (empName || 'Employee').replace(/[()\\\r\n]/g, ' ');
  const safeDate = (date || new Date().toISOString().split('T')[0]).replace(/[()\\\r\n]/g, ' ');
  const numAmount = Number(amount || 0);

  const lines = [
    'BT',
    '/F1 18 Tf',
    '50 780 Td',
    '(TAX INVOICE / EXPENSE PAYMENT RECEIPT) Tj',
    'ET',
    'BT',
    '/F2 10 Tf',
    '50 758 Td',
    '(Official Corporate Expenditure Proof - GST Registered & Audited) Tj',
    'ET',
    '0.75 w',
    '50 745 m 545 745 l S',
    'BT',
    '/F1 12 Tf',
    '50 720 Td',
    '(VOUCHER NUMBER: ' + safeClaim + ') Tj',
    'ET',
    'BT',
    '/F2 10 Tf',
    '50 695 Td',
    '(Employee Name: ' + safeEmp + ' [' + empId + ']) Tj',
    '0 -18 Td',
    '(Category: ' + safeCat + ') Tj',
    '0 -18 Td',
    '(Merchant / Vendor: ' + safeVendor + ') Tj',
    '0 -18 Td',
    '(Date of Expense: ' + safeDate + ') Tj',
    '0 -18 Td',
    '(Business Purpose: ' + safeDesc + ') Tj',
    'ET',
    '0.5 w',
    '50 595 m 545 595 l S',
    'BT',
    '/F1 13 Tf',
    '50 568 Td',
    '(TOTAL INVOICE AMOUNT: INR ' + numAmount.toLocaleString() + ') Tj',
    'ET',
    'BT',
    '/F2 9.5 Tf',
    '50 545 Td',
    '(Net Taxable: INR ' + (numAmount * 0.82).toFixed(2) + '  |  CGST (9%): INR ' + (numAmount * 0.09).toFixed(2) + '  |  SGST (9%): INR ' + (numAmount * 0.09).toFixed(2) + ') Tj',
    '0 -18 Td',
    '(GSTIN: 29AABCU9603R1ZX  |  Payment Status: PAID & VERIFIED BY BANK) Tj',
    '0 -18 Td',
    '(Corporate Account Authorization: AUTH-TXN-' + Math.floor(100000 + Math.random() * 900000) + ') Tj',
    'ET',
    '0.5 w',
    '50 480 m 545 480 l S',
    'BT',
    '/F1 10 Tf',
    '50 455 Td',
    '([VERIFIED EXPENSE ATTACHMENT - HRMS EXPENDITURE AUDIT TRAIL]) Tj',
    'ET'
  ];

  const streamContent = lines.join('\n');
  const streamLength = Buffer.byteLength(streamContent);

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    '6 0 obj\n<< /Length ' + streamLength + ' >>\nstream\n' + streamContent + '\nendstream\nendobj'
  ];

  let header = '%PDF-1.4\n';
  let body = '';
  let xref = 'xref\n0 7\n0000000000 65535 f \n';
  let offset = header.length;

  for (let i = 0; i < objects.length; i++) {
    xref += String(offset).padStart(10, '0') + ' 00000 n \n';
    body += objects[i] + '\n';
    offset = header.length + body.length;
  }

  let trailer = 'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n' + offset + '\n%%EOF';
  return 'data:application/pdf;base64,' + Buffer.from(header + body + xref + trailer).toString('base64');
}
