import { Vendor } from '../../../types';

/**
 * Deduplicates an array of vendors by unique ID.
 * Ensures repeated API responses or state merges never append duplicate IDs.
 */
export function dedupeVendorsById(vendors: Vendor[]): Vendor[] {
  if (!Array.isArray(vendors)) return [];
  const seenIds = new Set<string>();
  return vendors.filter(v => {
    if (!v || !v.id) return false;
    if (seenIds.has(v.id)) return false;
    seenIds.add(v.id);
    return true;
  });
}

/**
 * Normalizes a string for robust matching (lowercase, trimmed, collapsed whitespace).
 */
function normalizeStr(str?: string | null): string {
  return (str || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Determines whether two vendor records represent the exact same supplier business entity.
 * Two vendors are duplicates of each other if:
 * 1. They have the same non-empty GSTIN / Tax ID, OR
 * 2. They have the same name AND (same email OR same phone).
 */
export function isSameVendorEntity(a: Vendor, b: Vendor): boolean {
  if (a.id === b.id) return true;

  const aGstin = normalizeStr(a.gstin);
  const bGstin = normalizeStr(b.gstin);
  if (aGstin && bGstin && aGstin === bGstin) {
    return true;
  }

  const aName = normalizeStr(a.name);
  const bName = normalizeStr(b.name);
  if (aName && bName && aName === bName) {
    const aEmail = normalizeStr(a.email);
    const bEmail = normalizeStr(b.email);
    if (aEmail && bEmail && aEmail === bEmail) {
      return true;
    }

    const aPhone = (a.phone || '').replace(/[^0-9]/g, '');
    const bPhone = (b.phone || '').replace(/[^0-9]/g, '');
    if (aPhone && bPhone && aPhone.length >= 8 && aPhone === bPhone) {
      return true;
    }
  }

  return false;
}

/**
 * Returns a clean, deduplicated list of eligible vendors for procurement dropdowns.
 * 
 * Rules:
 * 1. Excludes Inactive vendors, EXCEPT when a vendor is currently selected (for editing existing POs).
 * 2. Deduplicates multiple database records representing the exact same supplier entity.
 *    - If selectedVendorId matches one of the duplicate records, that record is prioritized
 *      so editing an existing PO preserves the exact saved vendor ID.
 *    - Otherwise, the record with the most purchase order history or primary code is chosen.
 * 3. Preserves legitimate different vendors that share the same name (distinct entities with different IDs/GSTIN).
 * 4. Sorts alphabetically by vendor name.
 */
export function getEligibleVendorsForDropdown(
  vendors: Vendor[],
  selectedVendorId?: string
): Vendor[] {
  if (!Array.isArray(vendors)) return [];

  // Step 1: Deduplicate by ID
  const uniqueById = dedupeVendorsById(vendors);

  // Step 2: Filter by status (keep Active, but preserve currently selected vendor even if Inactive)
  const statusFiltered = uniqueById.filter(v => {
    if (selectedVendorId && v.id === selectedVendorId) {
      return true; // Always include the PO's existing vendor
    }
    const status = (v.status || 'Active').toLowerCase();
    return status === 'active';
  });

  // Step 3: Group duplicates of the same business entity
  const entityGroups: Vendor[][] = [];

  for (const vendor of statusFiltered) {
    let matchedGroup = entityGroups.find(group => 
      group.some(existing => isSameVendorEntity(existing, vendor))
    );

    if (matchedGroup) {
      matchedGroup.push(vendor);
    } else {
      entityGroups.push([vendor]);
    }
  }

  // Step 4: Pick one representative vendor per entity group
  const deduplicated: Vendor[] = entityGroups.map(group => {
    if (group.length === 1) return group[0];

    // If currently selected vendor is in this duplicate group, preserve it!
    if (selectedVendorId) {
      const selectedMatch = group.find(v => v.id === selectedVendorId);
      if (selectedMatch) return selectedMatch;
    }

    // Otherwise, pick the one with the most orders or most recent purchases
    return group.reduce((best, current) => {
      const bestOrders = (best.totalOrders || best.total_orders || 0);
      const curOrders = (current.totalOrders || current.total_orders || 0);
      if (curOrders > bestOrders) return current;

      // Prefer clean codes (e.g. VND-001) over timestamp codes (VND-178...)
      const bestIsTimestamp = /^VND-\d{10,}/.test(best.code || best.id);
      const curIsTimestamp = /^VND-\d{10,}/.test(current.code || current.id);
      if (bestIsTimestamp && !curIsTimestamp) return current;

      return best;
    });
  });

  // Step 5: Sort alphabetically by name
  return deduplicated.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/**
 * Formats display label for vendor dropdown options.
 * If two distinct vendors in the list share the same name, adds disambiguating
 * details (code, location, or GSTIN) so users can distinguish them.
 */
export function formatVendorDropdownLabel(
  vendor: Vendor,
  allDropdownVendors: Vendor[],
  options?: { includeCodeAlways?: boolean }
): string {
  const includeCode = options?.includeCodeAlways !== false;
  const sameNameCount = allDropdownVendors.filter(
    v => normalizeStr(v.name) === normalizeStr(vendor.name)
  ).length;

  const codeStr = vendor.code || vendor.id;

  // Name collision between distinct vendors: disambiguate with location/GSTIN
  if (sameNameCount > 1) {
    const loc = vendor.address ? vendor.address.split(',')[0].trim() : '';
    const detail = loc || vendor.gstin || vendor.contactPerson || vendor.contact_person || '';
    if (detail) {
      return `${vendor.name} (${codeStr} • ${detail})`;
    }
    return `${vendor.name} (${codeStr})`;
  }

  if (includeCode) {
    return `${vendor.name} (${codeStr})`;
  }

  return vendor.name;
}
