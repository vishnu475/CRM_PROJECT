/**
 * Centralized Customer Health & Status Classification Service (STEP 14)
 * 
 * Computes customer health based on real data across CRM tables:
 * - activities
 * - opportunities
 * - projects
 * - sales_orders
 * - follow_ups
 * - crm_invoices
 */

/**
 * Pure evaluation function for Customer Health
 * 
 * @param {Object} customer - Customer record
 * @param {Object} signals - Aggregated health signals
 * @param {Date} [referenceDate] - Current evaluation date (default: new Date())
 * @returns {Object} Health result with status, metrics, and explanatory reasons
 */
export function evaluateCustomerHealth(customer, signals = {}, referenceDate = new Date()) {
  const now = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);

  // 1. Archived check (Preserve explicit archived state)
  if (customer && customer.status === 'Archived') {
    return {
      customerId: customer.id,
      customerName: customer.customer_name || customer.customerName,
      status: 'Archived',
      daysSinceLastActivity: signals.daysSinceLastActivity ?? null,
      lastActivityDate: signals.lastActivityDate || null,
      activeProjects: signals.activeProjects || 0,
      openOpportunities: signals.openOpportunities || 0,
      activeSalesOrders: signals.activeSalesOrders || 0,
      overdueFollowUps: signals.overdueFollowUps || 0,
      overdueInvoices: signals.overdueInvoices || 0,
      delayedProjects: signals.delayedProjects || 0,
      reasons: ['Customer account is archived.']
    };
  }

  const daysSinceLastActivity = signals.daysSinceLastActivity ?? null;
  const activeProjects = signals.activeProjects || 0;
  const openOpportunities = signals.openOpportunities || 0;
  const activeSalesOrders = signals.activeSalesOrders || 0;
  const overdueFollowUps = signals.overdueFollowUps || 0;
  const overdueInvoices = signals.overdueInvoices || 0;
  const delayedProjects = signals.delayedProjects || 0;

  const reasons = [];

  // 2. INACTIVE Condition:
  // (No recent activity for >= 90 days OR no activity recorded)
  // AND no active projects
  // AND no open opportunities
  // AND no active sales orders
  const isNoRecentActivity90 = daysSinceLastActivity === null || daysSinceLastActivity >= 90;
  const hasNoActiveBusiness = activeProjects === 0 && openOpportunities === 0 && activeSalesOrders === 0;

  if (isNoRecentActivity90 && hasNoActiveBusiness) {
    if (daysSinceLastActivity !== null) {
      reasons.push(`No meaningful activity for ${daysSinceLastActivity} days`);
    } else {
      reasons.push('No recorded customer activity');
    }
    reasons.push('No active projects');
    reasons.push('No open opportunities');
    if (activeSalesOrders === 0) {
      reasons.push('No active sales orders');
    }

    return {
      customerId: customer?.id,
      customerName: customer?.customer_name || customer?.customerName,
      status: 'Inactive',
      daysSinceLastActivity,
      lastActivityDate: signals.lastActivityDate || null,
      activeProjects,
      openOpportunities,
      activeSalesOrders,
      overdueFollowUps,
      overdueInvoices,
      delayedProjects,
      reasons
    };
  }

  // 3. AT RISK Condition:
  // If not Inactive, check if warning signals exist:
  // - daysSinceLastActivity > 30 (or no activity recorded)
  // - overdueFollowUps > 0
  // - overdueInvoices > 0
  // - delayedProjects > 0
  const riskWarnings = [];

  if (daysSinceLastActivity === null) {
    riskWarnings.push('No recent customer activity recorded');
  } else if (daysSinceLastActivity > 30) {
    riskWarnings.push(`No recent activity for ${daysSinceLastActivity} days`);
  }

  if (overdueFollowUps > 0) {
    riskWarnings.push(`${overdueFollowUps} overdue follow-up${overdueFollowUps > 1 ? 's' : ''}`);
  }

  if (overdueInvoices > 0) {
    riskWarnings.push(`${overdueInvoices} overdue invoice${overdueInvoices > 1 ? 's' : ''}`);
  }

  if (delayedProjects > 0) {
    riskWarnings.push(`${delayedProjects} delayed project${delayedProjects > 1 ? 's' : ''}`);
  }

  if (riskWarnings.length > 0) {
    return {
      customerId: customer?.id,
      customerName: customer?.customer_name || customer?.customerName,
      status: 'At Risk',
      daysSinceLastActivity,
      lastActivityDate: signals.lastActivityDate || null,
      activeProjects,
      openOpportunities,
      activeSalesOrders,
      overdueFollowUps,
      overdueInvoices,
      delayedProjects,
      reasons: riskWarnings
    };
  }

  // 4. ACTIVE Condition:
  // If neither Inactive nor At Risk:
  const activeReasons = [];
  if (daysSinceLastActivity !== null && daysSinceLastActivity <= 30) {
    activeReasons.push(`Recent interaction ${daysSinceLastActivity === 0 ? 'today' : `${daysSinceLastActivity} day${daysSinceLastActivity > 1 ? 's' : ''} ago`}`);
  }
  if (activeProjects > 0) {
    activeReasons.push(`${activeProjects} active project${activeProjects > 1 ? 's' : ''}`);
  }
  if (openOpportunities > 0) {
    activeReasons.push(`${openOpportunities} open opportunit${openOpportunities > 1 ? 'ies' : 'y'}`);
  }
  if (activeSalesOrders > 0) {
    activeReasons.push(`${activeSalesOrders} active sales order${activeSalesOrders > 1 ? 's' : ''}`);
  }
  activeReasons.push('No major risk detected');

  return {
    customerId: customer?.id,
    customerName: customer?.customer_name || customer?.customerName,
    status: 'Active',
    daysSinceLastActivity,
    lastActivityDate: signals.lastActivityDate || null,
    activeProjects,
    openOpportunities,
    activeSalesOrders,
    overdueFollowUps,
    overdueInvoices,
    delayedProjects,
    reasons: activeReasons
  };
}

/**
 * Fetches health signals for a batch of customers from PostgreSQL
 * using optimized batched queries to prevent N+1 overhead.
 * 
 * @param {Object} pool - CRM Database Pool
 * @param {Array<string>} [customerIds] - Optional customer IDs filter
 * @param {Date} [referenceDate] - Current date
 * @returns {Promise<Map<string, Object>>} Map of customerId -> HealthResult
 */
export async function batchGetCustomersHealth(pool, customerIds = null, referenceDate = new Date()) {
  const now = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const nowIsoDate = now.toISOString().split('T')[0];

  // 1. Fetch Customers
  let custQuery = 'SELECT id, customer_code, customer_name, status, converted_from_lead_id FROM customers';
  const params = [];
  if (customerIds && customerIds.length > 0) {
    params.push(customerIds);
    custQuery += ' WHERE id = ANY($1)';
  }
  const custRes = await pool.query(custQuery, params);
  const customers = custRes.rows;

  if (customers.length === 0) {
    return new Map();
  }

  // Maps for quick matching by customer id, name, and converted lead id
  const idToCust = new Map();
  const nameToCust = new Map();
  const leadIdToCust = new Map();

  for (const c of customers) {
    idToCust.set(c.id, c);
    if (c.customer_name) nameToCust.set(c.customer_name.trim().toLowerCase(), c);
    if (c.converted_from_lead_id) leadIdToCust.set(c.converted_from_lead_id, c);
  }

  // Helper to initialize signal bucket
  const customerSignals = new Map();
  for (const c of customers) {
    customerSignals.set(c.id, {
      latestActivityTimestamp: null,
      lastActivityDate: null,
      daysSinceLastActivity: null,
      activeProjects: 0,
      delayedProjects: 0,
      openOpportunities: 0,
      activeSalesOrders: 0,
      overdueFollowUps: 0,
      overdueInvoices: 0
    });
  }

  // 2. Query Activities (Grouped / Batched)
  // Check due_date and created_at
  const actRes = await pool.query(`
    SELECT id, customer_id, related_to, due_date, created_at, status
    FROM activities
  `);

  for (const a of actRes.rows) {
    let targetCust = null;
    if (a.customer_id && idToCust.has(a.customer_id)) {
      targetCust = idToCust.get(a.customer_id);
    } else if (a.related_to) {
      const rel = a.related_to.trim();
      if (idToCust.has(rel)) targetCust = idToCust.get(rel);
      else if (nameToCust.has(rel.toLowerCase())) targetCust = nameToCust.get(rel.toLowerCase());
      else if (leadIdToCust.has(rel)) targetCust = leadIdToCust.get(rel);
    }

    if (targetCust) {
      const sig = customerSignals.get(targetCust.id);
      // Determine activity date
      let actTime = null;
      if (a.due_date) {
        const d = new Date(a.due_date);
        if (!isNaN(d.getTime())) actTime = d.getTime();
      }
      if (!actTime && a.created_at) {
        const d = new Date(a.created_at);
        if (!isNaN(d.getTime())) actTime = d.getTime();
      }

      if (actTime !== null) {
        if (!sig.latestActivityTimestamp || actTime > sig.latestActivityTimestamp) {
          sig.latestActivityTimestamp = actTime;
          sig.lastActivityDate = new Date(actTime).toISOString().split('T')[0];
        }
      }
    }
  }

  // 3. Query Opportunities (Open vs Closed)
  const oppRes = await pool.query(`
    SELECT id, customer_id, customer_name, stage
    FROM opportunities
  `);

  for (const o of oppRes.rows) {
    let targetCust = null;
    if (o.customer_id && idToCust.has(o.customer_id)) {
      targetCust = idToCust.get(o.customer_id);
    } else if (o.customer_name && nameToCust.has(o.customer_name.trim().toLowerCase())) {
      targetCust = nameToCust.get(o.customer_name.trim().toLowerCase());
    }

    if (targetCust) {
      const sig = customerSignals.get(targetCust.id);
      if (o.stage !== 'Won' && o.stage !== 'Lost') {
        sig.openOpportunities += 1;
      }
    }
  }

  // 4. Query Projects (Active & Delayed)
  const prjRes = await pool.query(`
    SELECT id, client, customer_id, source_lead_id, status, end_date
    FROM projects
  `);

  for (const p of prjRes.rows) {
    let targetCust = null;
    if (p.customer_id && idToCust.has(p.customer_id)) {
      targetCust = idToCust.get(p.customer_id);
    } else if (p.client && nameToCust.has(p.client.trim().toLowerCase())) {
      targetCust = nameToCust.get(p.client.trim().toLowerCase());
    } else if (p.source_lead_id && leadIdToCust.has(p.source_lead_id)) {
      targetCust = leadIdToCust.get(p.source_lead_id);
    }

    if (targetCust) {
      const sig = customerSignals.get(targetCust.id);
      const isCompletedOrCancelled = ['completed', 'cancelled', 'canceled'].includes((p.status || '').toLowerCase());
      if (!isCompletedOrCancelled) {
        sig.activeProjects += 1;

        // Check if delayed
        let isDelayed = false;
        if ((p.status || '').toLowerCase() === 'delayed') {
          isDelayed = true;
        } else if (p.end_date) {
          const endDateStr = typeof p.end_date === 'string' ? p.end_date.split('T')[0] : new Date(p.end_date).toISOString().split('T')[0];
          if (endDateStr < nowIsoDate) {
            isDelayed = true;
          }
        }
        if (isDelayed) {
          sig.delayedProjects += 1;
        }
      }
    }
  }

  // 5. Query Sales Orders
  const soRes = await pool.query(`
    SELECT id, customer_id, customer_name, fulfillment_status
    FROM sales_orders
  `);

  for (const so of soRes.rows) {
    let targetCust = null;
    if (so.customer_id && idToCust.has(so.customer_id)) {
      targetCust = idToCust.get(so.customer_id);
    } else if (so.customer_name && nameToCust.has(so.customer_name.trim().toLowerCase())) {
      targetCust = nameToCust.get(so.customer_name.trim().toLowerCase());
    }

    if (targetCust) {
      const sig = customerSignals.get(targetCust.id);
      const isCancelled = (so.fulfillment_status || '').toLowerCase() === 'cancelled';
      if (!isCancelled) {
        sig.activeSalesOrders += 1;
      }
    }
  }

  // 6. Query Follow-ups (Overdue)
  const fuRes = await pool.query(`
    SELECT id, related_entity, opportunity_id, due_date, status
    FROM follow_ups
  `);

  for (const fu of fuRes.rows) {
    let targetCust = null;
    if (fu.related_entity) {
      const rel = fu.related_entity.trim();
      if (idToCust.has(rel)) targetCust = idToCust.get(rel);
      else if (nameToCust.has(rel.toLowerCase())) targetCust = nameToCust.get(rel.toLowerCase());
      else if (leadIdToCust.has(rel)) targetCust = leadIdToCust.get(rel);
    }

    if (targetCust) {
      const sig = customerSignals.get(targetCust.id);
      const st = (fu.status || '').toLowerCase();
      const isDone = ['done', 'completed', 'cancelled'].includes(st);
      if (!isDone) {
        let isOverdue = st === 'overdue';
        if (!isOverdue && fu.due_date) {
          const dueDateStr = typeof fu.due_date === 'string' ? fu.due_date.split('T')[0] : new Date(fu.due_date).toISOString().split('T')[0];
          if (dueDateStr < nowIsoDate) {
            isOverdue = true;
          }
        }
        if (isOverdue) {
          sig.overdueFollowUps += 1;
        }
      }
    }
  }

  // 7. Query CRM Invoices (Overdue)
  const invRes = await pool.query(`
    SELECT id, customer_id, customer_name, due_date, amount, paid_amount, status
    FROM crm_invoices
  `);

  for (const inv of invRes.rows) {
    let targetCust = null;
    if (inv.customer_id && idToCust.has(inv.customer_id)) {
      targetCust = idToCust.get(inv.customer_id);
    } else if (inv.customer_name && nameToCust.has(inv.customer_name.trim().toLowerCase())) {
      targetCust = nameToCust.get(inv.customer_name.trim().toLowerCase());
    }

    if (targetCust) {
      const sig = customerSignals.get(targetCust.id);
      const st = (inv.status || '').toLowerCase();
      const isPaid = st === 'paid' || (parseFloat(inv.paid_amount || 0) >= parseFloat(inv.amount || 0) && parseFloat(inv.amount || 0) > 0);
      const isCancelled = st === 'cancelled';
      if (!isPaid && !isCancelled) {
        let isOverdue = st === 'overdue';
        if (!isOverdue && inv.due_date) {
          const dueDateStr = typeof inv.due_date === 'string' ? inv.due_date.split('T')[0] : new Date(inv.due_date).toISOString().split('T')[0];
          if (dueDateStr < nowIsoDate) {
            isOverdue = true;
          }
        }
        if (isOverdue) {
          sig.overdueInvoices += 1;
        }
      }
    }
  }

  // 8. Calculate Final Health for each Customer
  const resultMap = new Map();

  for (const c of customers) {
    const sig = customerSignals.get(c.id);
    if (sig.latestActivityTimestamp) {
      const diffMs = now.getTime() - sig.latestActivityTimestamp;
      sig.daysSinceLastActivity = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      sig.daysSinceLastActivity = null;
    }

    const health = evaluateCustomerHealth(c, sig, now);
    resultMap.set(c.id, health);
  }

  return resultMap;
}

/**
 * Fetches health for a single customer
 */
export async function getCustomerHealth(pool, customerId, referenceDate = new Date()) {
  const map = await batchGetCustomersHealth(pool, [customerId], referenceDate);
  return map.get(customerId) || null;
}
