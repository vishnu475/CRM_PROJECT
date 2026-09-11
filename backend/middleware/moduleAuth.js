import { hrmsPool as pool } from '../db/pool.js';

// Route prefix to module code mapping
const ROUTE_MODULE_MAP = {
  '/api/attendance': ['attendance', 'MOD-ATT'],
  '/api/shifts': ['attendance', 'MOD-ATT'],
  '/api/leave': ['leave', 'MOD-LEV'],
  '/api/payroll': ['payroll', 'MOD-PAY'],
  '/api/recruitment': ['recruitment', 'MOD-REC'],
  '/api/accounts': ['accounts', 'MOD-ACC'],
  '/api/ledger': ['ledger', 'MOD-LEDG'],
  '/api/banking': ['banking', 'MOD-BNK'],
  '/api/expenses': ['expenses', 'MOD-EXP'],
  '/api/purchases': ['purchases', 'MOD-PUR'],
  '/api/vendors': ['vendors', 'MOD-VEND'],
  '/api/inventory': ['inventory', 'MOD-INV'],
  '/api/leads': ['leads', 'crm', 'MOD-LEAD', 'MOD-CRM'],
  '/api/customers': ['customers', 'crm', 'MOD-CUST', 'MOD-CRM'],
  '/api/opportunities': ['opportunities', 'crm', 'MOD-OPP', 'MOD-CRM'],
  '/api/quotations': ['quotations', 'crm', 'MOD-QUOT', 'MOD-CRM'],
  '/api/sales-orders': ['sales_orders', 'crm', 'MOD-SALES', 'MOD-CRM'],
  '/api/crm': ['crm', 'MOD-CRM']
};

/**
 * Middleware: protectModuleRoute
 * Enforces that logged-in employees can ONLY access API endpoints for modules assigned to them in the database.
 */
export async function protectModuleRoute(req, res, next) {
  // Allow admins, executives, or public paths
  const role = req.user?.role || req.headers['x-user-role'];
  const empId = req.user?.empCode || req.user?.id || req.headers['x-employee-id'];

  // Only restrict users with Employee role
  if (role !== 'Employee' && role !== 'EMPLOYEE') {
    return next();
  }

  // Find if current request matches a protected module route
  const currentPath = req.originalUrl || req.baseUrl || req.path;
  let requiredModules = null;
  for (const [routePrefix, mods] of Object.entries(ROUTE_MODULE_MAP)) {
    if (currentPath.startsWith(routePrefix)) {
      requiredModules = mods;
      break;
    }
  }

  // If path is not restricted to specific modules, let it pass
  if (!requiredModules) {
    return next();
  }

  try {
    // Check if this employee has any of the required modules assigned in database
    const query = `
      SELECT m.code, m.id, LOWER(m.name) as name
      FROM employee_assigned_modules eam
      JOIN modules m ON eam.module_id = m.id
      WHERE (eam.employee_id = $1 OR LOWER(eam.employee_id) = LOWER($1))
        AND m.status = 'active'
    `;
    const result = await pool.query(query, [empId]);

    const assignedCodes = result.rows.map(r => String(r.code || '').toLowerCase());
    const assignedIds = result.rows.map(r => String(r.id || '').toLowerCase());
    const assignedNames = result.rows.map(r => String(r.name || '').toLowerCase());

    const hasAccess = requiredModules.some(rm => {
      const lower = rm.toLowerCase();
      return assignedCodes.includes(lower) || assignedIds.includes(lower) || assignedNames.includes(lower);
    });

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Module not assigned to Employee ${empId}. Contact your Team Head or Administrator.`
      });
    }

    next();
  } catch (err) {
    console.error('Module route authorization check error:', err);
    next();
  }
}
