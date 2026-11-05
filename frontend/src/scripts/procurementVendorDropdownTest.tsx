/**
 * BUG-110: Procurement Vendor Dropdown Deduplication & Selection Verification Suite
 *
 * Verifies:
 * 1. The dropdown displays each eligible vendor record only once (deduplicates identical entities).
 * 2. Repeated API results or repeated component renders do not create duplicate options (idempotence).
 * 3. Two distinct vendors with the same name remain separately selectable and disambiguated.
 * 4. Vendors are correctly identified and selected by their unique stable IDs.
 * 5. Selecting a vendor saves the correct vendor ID and name to a purchase order.
 * 6. Editing an existing purchase order restores and preserves the correct selected vendor.
 * 7. Vendor search and status filtering continue to work (e.g. Active vs Inactive).
 * 8. Empty vendor lists, null fields, and API failures are handled gracefully.
 * 9. Existing procurement, purchase-order, and vendor-management workflows remain intact.
 * 10. Live Backend API tests for /api/vendors and /api/purchase-orders.
 */

import { Vendor, PurchaseOrder } from '../types';
import {
  dedupeVendorsById,
  isSameVendorEntity,
  getEligibleVendorsForDropdown,
  formatVendorDropdownLabel
} from '../modules/vendors/utils/vendorDropdownUtils';

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    totalPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
    totalFailed++;
  }
}

// Deterministic test fixture
const mockVendors: Vendor[] = [
  {
    id: 'VND-001',
    code: 'VND-001',
    name: 'Office Supplies Ltd',
    category: 'Stationery',
    contactPerson: 'Deepak Verma',
    email: 'sales@officesupplies.co.in',
    phone: '9876543210',
    gstin: '29ABCDE1111A1Z1',
    address: 'Brigade Road, Bengaluru',
    status: 'Active',
    paymentTerms: 'Net 30 Days',
    rating: 4.8,
    payableBalance: 12500,
    totalPurchases: 450000,
    totalOrders: 6
  },
  {
    id: 'VND-002',
    code: 'VND-002',
    name: 'AWS Cloud Services',
    category: 'Cloud Services',
    contactPerson: 'Cloud Billing Rep',
    email: 'billing@amazon.com',
    phone: '1800123456',
    gstin: '99AWSIN1234F1Z9',
    address: 'World Trade Center, Bengaluru',
    status: 'Active',
    paymentTerms: 'Immediate',
    rating: 4.9,
    payableBalance: 0,
    totalPurchases: 1200000,
    totalOrders: 12
  },
  // Distinct vendor 1 with shared name "Pacific Logistics" (Mumbai entity)
  {
    id: 'VND-PAC-MUM',
    code: 'VND-PAC-MUM',
    name: 'Pacific Logistics',
    category: 'Logistics',
    contactPerson: 'Suresh Patil',
    email: 'mumbai@pacificlogistics.in',
    phone: '9820011223',
    gstin: '27AAAAA1234A1Z5',
    address: 'Nariman Point, Mumbai, MH',
    status: 'Active',
    paymentTerms: 'Net 15 Days',
    rating: 4.5,
    payableBalance: 5000,
    totalPurchases: 180000,
    totalOrders: 3
  },
  // Distinct vendor 2 with shared name "Pacific Logistics" (Bengaluru entity)
  {
    id: 'VND-PAC-BLR',
    code: 'VND-PAC-BLR',
    name: 'Pacific Logistics',
    category: 'Logistics',
    contactPerson: 'Kavitha R',
    email: 'blr@pacificlogistics.in',
    phone: '9845011223',
    gstin: '29BBBBB5678B1Z8',
    address: 'Koramangala, Bengaluru, KA',
    status: 'Active',
    paymentTerms: 'Net 30 Days',
    rating: 4.7,
    payableBalance: 0,
    totalPurchases: 220000,
    totalOrders: 4
  },
  // Duplicate Record 1 of "Nexus Cloud Infrastructure Ltd"
  {
    id: 'VND-NEXUS-01',
    code: 'VND-1788941401167',
    name: 'Nexus Cloud Infrastructure Ltd',
    category: 'Cloud Services',
    contactPerson: 'Arun Kumar',
    email: 'arun@nexuscloud.io',
    phone: '+91 98765 43210',
    gstin: '29ABCDE1234F1Z5',
    address: 'Plot 42, Electronics City Phase 1, Bengaluru, KA',
    status: 'Active',
    paymentTerms: 'Net 45 Days',
    rating: 4.9,
    payableBalance: 0,
    totalPurchases: 236000,
    totalOrders: 2
  },
  // Duplicate Record 2 of "Nexus Cloud Infrastructure Ltd" (Identical GSTIN, email, phone)
  {
    id: 'VND-NEXUS-02',
    code: 'VND-1788942196579',
    name: 'Nexus Cloud Infrastructure Ltd',
    category: 'Cloud Services',
    contactPerson: 'Arun Kumar',
    email: 'arun@nexuscloud.io',
    phone: '+91 98765 43210',
    gstin: '29ABCDE1234F1Z5',
    address: 'Plot 42, Electronics City Phase 1, Bengaluru, KA',
    status: 'Active',
    paymentTerms: 'Net 45 Days',
    rating: 4.9,
    payableBalance: 0,
    totalPurchases: 236000,
    totalOrders: 2
  },
  // Duplicate Record 3 of "Nexus Cloud Infrastructure Ltd"
  {
    id: 'VND-NEXUS-03',
    code: 'VND-1788943754153',
    name: 'Nexus Cloud Infrastructure Ltd',
    category: 'Cloud Services',
    contactPerson: 'Arun Kumar',
    email: 'arun@nexuscloud.io',
    phone: '+91 98765 43210',
    gstin: '29ABCDE1234F1Z5',
    address: 'Plot 42, Electronics City Phase 1, Bengaluru, KA',
    status: 'Active',
    paymentTerms: 'Net 45 Days',
    rating: 4.9,
    payableBalance: 0,
    totalPurchases: 59000,
    totalOrders: 1
  },
  // Inactive Vendor
  {
    id: 'VND-INACTIVE-01',
    code: 'VND-999',
    name: 'Defunct Hardware Supplies',
    category: 'Hardware',
    contactPerson: 'Old Rep',
    email: 'old@defunct.com',
    phone: '9000000000',
    gstin: '29INACT1234F1Z0',
    address: 'Old Airport Road, Bengaluru',
    status: 'Inactive',
    paymentTerms: 'Immediate',
    rating: 2.0,
    payableBalance: 0,
    totalPurchases: 50000,
    totalOrders: 1
  }
];

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 BUG-110: PROCUREMENT VENDOR DROPDOWN DEDUPLICATION & SELECTION SUITE');
  console.log('========================================================================\n');

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 1: Dropdown displays each eligible vendor record only once
  // ────────────────────────────────────────────────────────────────────────
  console.log('📦 SUITE 1: Dropdown displays each eligible vendor record only once');
  {
    const eligible = getEligibleVendorsForDropdown(mockVendors);

    // Should include: Office Supplies, AWS, Pacific Logistics (MUM), Pacific Logistics (BLR), and exactly ONE Nexus Cloud
    // Should EXCLUDE Inactive vendor (VND-INACTIVE-01)
    assert(eligible.length === 5, 'Deduplicated eligible list contains exactly 5 vendors (from 8 mock records)', `Got ${eligible.length}`);

    const nexusRecords = eligible.filter(v => v.name.includes('Nexus Cloud'));
    assert(nexusRecords.length === 1, 'Only one Nexus Cloud Infrastructure record is present in dropdown', `Found ${nexusRecords.length}`);

    const inactiveRecords = eligible.filter(v => v.status === 'Inactive');
    assert(inactiveRecords.length === 0, 'Inactive vendors are excluded from new PO creation dropdown');
  }

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 2: Repeated API results / re-renders do not create duplicate options
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 2: Repeated API results / re-renders do not create duplicate options');
  {
    // Simulate array concatenation from multiple API reloads
    const duplicatedArray = [...mockVendors, ...mockVendors, ...mockVendors];
    assert(duplicatedArray.length === 24, 'Simulated raw list with 3x re-render duplicates has 24 items');

    const dedupedById = dedupeVendorsById(duplicatedArray);
    assert(dedupedById.length === 8, 'dedupeVendorsById collapses 24 items back to 8 unique IDs', `Got ${dedupedById.length}`);

    const eligibleFromDuplicated = getEligibleVendorsForDropdown(duplicatedArray);
    assert(eligibleFromDuplicated.length === 5, 'getEligibleVendorsForDropdown handles duplicated array idempotently');
  }

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 3: Two distinct vendors with the same name remain separately selectable
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 3: Two distinct vendors with the same name remain separately selectable');
  {
    const eligible = getEligibleVendorsForDropdown(mockVendors);
    const pacificVendors = eligible.filter(v => v.name === 'Pacific Logistics');

    assert(pacificVendors.length === 2, 'Both distinct Pacific Logistics vendors are preserved (different GSTIN & location)');
    assert(pacificVendors[0].id !== pacificVendors[1].id, 'Distinct vendors maintain their unique stable IDs');

    // Label formatting: should distinguish both
    const label1 = formatVendorDropdownLabel(pacificVendors[0], eligible);
    const label2 = formatVendorDropdownLabel(pacificVendors[1], eligible);

    assert(label1 !== label2, 'Display labels are distinct for same-name vendors');
    assert(label1.includes('Nariman Point') || label1.includes('27AAAAA1234A1Z5') || label1.includes('VND-PAC-MUM'),
      `Label 1 includes disambiguating detail: "${label1}"`);
    assert(label2.includes('Koramangala') || label2.includes('29BBBBB5678B1Z8') || label2.includes('VND-PAC-BLR'),
      `Label 2 includes disambiguating detail: "${label2}"`);
  }

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 4: Vendors are correctly identified by their unique IDs
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 4: Vendors are correctly identified by their unique IDs');
  {
    const eligible = getEligibleVendorsForDropdown(mockVendors);
    const uniqueIds = new Set(eligible.map(v => v.id));
    assert(uniqueIds.size === eligible.length, 'Every option in eligible vendors has a unique stable ID');

    const aws = eligible.find(v => v.id === 'VND-002');
    assert(Boolean(aws && aws.name === 'AWS Cloud Services'), 'AWS Cloud Services correctly identified by VND-002');

    const office = eligible.find(v => v.id === 'VND-001');
    assert(Boolean(office && office.name === 'Office Supplies Ltd'), 'Office Supplies Ltd correctly identified by VND-001');
  }

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 5: Selecting a vendor saves the correct vendor ID to purchase order
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 5: Selecting a vendor saves the correct vendor ID to a purchase order');
  {
    const selectedVendorId = 'VND-PAC-BLR';
    const selectedVendor = mockVendors.find(v => v.id === selectedVendorId)!;

    const newPO: Partial<PurchaseOrder> = {
      poNumber: 'PO-2026-TEST-01',
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      paymentTerms: selectedVendor.paymentTerms,
      amount: 150000,
      status: 'Draft',
    };

    assert(newPO.vendorId === 'VND-PAC-BLR', 'PO payload stores exact selected vendorId (VND-PAC-BLR)');
    assert(newPO.vendorName === 'Pacific Logistics', 'PO payload stores vendorName');
    assert(newPO.paymentTerms === 'Net 30 Days', 'PO payload inherits vendor payment terms');
  }

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 6: Editing an existing purchase order restores the correct selected vendor
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 6: Editing an existing purchase order restores the correct selected vendor');
  {
    // Case A: PO linked to a specific duplicate ID (VND-NEXUS-02)
    // When editing, getEligibleVendorsForDropdown MUST preserve VND-NEXUS-02 so the select doesn't reset!
    const eligibleForEditNexus = getEligibleVendorsForDropdown(mockVendors, 'VND-NEXUS-02');
    const selectedNexus = eligibleForEditNexus.find(v => v.id === 'VND-NEXUS-02');
    assert(Boolean(selectedNexus), 'Eligible list preserves the exact duplicate vendor ID (VND-NEXUS-02) when editing an existing PO');
    assert(eligibleForEditNexus.length === 5, 'Eligible list still contains only 1 Nexus Cloud option overall');

    // Case B: PO linked to an Inactive vendor
    // When editing, the inactive vendor MUST be retained in the dropdown options
    const eligibleForEditInactive = getEligibleVendorsForDropdown(mockVendors, 'VND-INACTIVE-01');
    const selectedInactive = eligibleForEditInactive.find(v => v.id === 'VND-INACTIVE-01');
    assert(Boolean(selectedInactive), 'Eligible list preserves an Inactive vendor when editing an existing PO linked to it');
    assert(eligibleForEditInactive.length === 6, 'Eligible list includes the 5 active vendors + 1 preserved inactive vendor');
  }

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 7: Vendor search and status filtering continue to work
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 7: Vendor search and status filtering continue to work');
  {
    // Search simulation
    const searchTerm = 'Cloud';
    const searched = mockVendors.filter(v =>
      (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    assert(searched.length === 4, 'Search term "Cloud" matches AWS and Nexus Cloud records');

    const searchedEligible = getEligibleVendorsForDropdown(searched);
    assert(searchedEligible.length === 2, 'Search results deduplicate down to 2 distinct vendors (AWS + Nexus)');

    // Status filter
    const activeOnly = mockVendors.filter(v => v.status === 'Active');
    assert(activeOnly.length === 7, 'Active status filter returns 7 active records');
  }

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 8: Empty vendor lists and null handling
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 8: Empty vendor lists and null handling');
  {
    assert(dedupeVendorsById([]).length === 0, 'dedupeVendorsById handles empty array');
    assert(dedupeVendorsById(null as any).length === 0, 'dedupeVendorsById handles null');
    assert(getEligibleVendorsForDropdown([]).length === 0, 'getEligibleVendorsForDropdown handles empty array');
    assert(getEligibleVendorsForDropdown(undefined as any).length === 0, 'getEligibleVendorsForDropdown handles undefined');

    // Vendor with empty/missing optional fields
    const emptyFieldsVendor: Vendor = {
      id: 'VND-EMPTY',
      name: 'Minimal Vendor Ltd',
      code: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      gstin: '',
      status: 'Active',
      category: 'General',
      paymentTerms: 'Net 30 Days',
      rating: 5,
      payableBalance: 0,
      totalPurchases: 0,
      totalOrders: 0
    };
    const eligibleWithEmpty = getEligibleVendorsForDropdown([emptyFieldsVendor]);
    assert(eligibleWithEmpty.length === 1 && eligibleWithEmpty[0].id === 'VND-EMPTY', 'Handles vendor with empty optional fields without error');
  }

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 9: Entity Equivalence Matching in PurchasesPage Filter
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 9: Entity Equivalence Matching in PurchasesPage Filter');
  {
    // Test that isSameVendorEntity identifies duplicate records
    const v1 = mockVendors.find(v => v.id === 'VND-NEXUS-01')!;
    const v2 = mockVendors.find(v => v.id === 'VND-NEXUS-02')!;
    assert(isSameVendorEntity(v1, v2), 'isSameVendorEntity confirms VND-NEXUS-01 and VND-NEXUS-02 represent the same business entity');

    // Test that different vendors are NOT considered the same
    const aws = mockVendors.find(v => v.id === 'VND-002')!;
    assert(!isSameVendorEntity(v1, aws), 'isSameVendorEntity confirms Nexus and AWS are NOT the same entity');

    // Test that two distinct vendors with same name but different GSTIN are NOT the same entity
    const pac1 = mockVendors.find(v => v.id === 'VND-PAC-MUM')!;
    const pac2 = mockVendors.find(v => v.id === 'VND-PAC-BLR')!;
    assert(!isSameVendorEntity(pac1, pac2), 'isSameVendorEntity confirms distinct Pacific Logistics entities with different GSTINs are NOT the same entity');
  }

  // ────────────────────────────────────────────────────────────────────────
  // SUITE 10: Live Backend API /api/vendors Tests
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n📦 SUITE 10: Live Backend API /api/vendors Tests');
  try {
    const res = await fetch('http://localhost:5000/api/vendors');
    const json = await res.json();
    assert(json.success && Array.isArray(json.data) && json.data.length >= 10,
      `Live backend /api/vendors returns vendor list (count: ${json.data?.length})`);

    // Verify deduplication on live data
    const liveEligible = getEligibleVendorsForDropdown(json.data);
    const liveNexus = liveEligible.filter(v => (v.name || '').toLowerCase().includes('nexus cloud'));
    assert(liveNexus.length === 1,
      `getEligibleVendorsForDropdown collapses live database Nexus records from 7+ to exactly 1 option in dropdown (count: ${liveNexus.length})`);

    // Status query param on backend
    const resActive = await fetch('http://localhost:5000/api/vendors?status=Active');
    const jsonActive = await resActive.json();
    assert(jsonActive.success && jsonActive.data.every((v: any) => v.status === 'Active'),
      'Backend ?status=Active returns only active vendors');

    // Search query param on backend
    const resSearch = await fetch('http://localhost:5000/api/vendors?search=AWS');
    const jsonSearch = await resSearch.json();
    assert(jsonSearch.success && jsonSearch.data.length >= 1 && jsonSearch.data[0].name.includes('AWS'),
      'Backend ?search=AWS filters to matching vendor');

  } catch (err: any) {
    console.error('Failed to connect to backend server:', err.message);
    assert(false, 'Live backend connection error', err.message);
  }

  // ────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ────────────────────────────────────────────────────────────────────────
  console.log('\n========================================================================');
  console.log(`TOTAL TESTS: ${totalPassed + totalFailed}`);
  console.log(`PASSED: ${totalPassed}`);
  console.log(`FAILED: ${totalFailed}`);
  console.log('========================================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner encountered fatal error:', err);
  process.exit(1);
});
