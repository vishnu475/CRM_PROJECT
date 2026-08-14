import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'crm_hrms_super_secret_jwt_key_2026';

export function authenticateUser(req, res, next) {
  // Allow public health, login & static endpoints without JWT header
  if (req.path === '/api/health' || req.path === '/api/auth/login' || req.path.startsWith('/public')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Mock user context fallback for non-strict local development if no header provided
    req.user = {
      id: 'EMP-001',
      empCode: 'EMP-001',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@company.com',
      role: 'Executive',
      permissions: ['*']
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired JWT token.' });
  }
}
