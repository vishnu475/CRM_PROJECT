import express from 'express';
import { AuthService } from '../services/authService.js';

const router = express.Router();

// POST /api/auth/login - Employee ID + PIN Authentication
router.post('/login', async (req, res) => {
  const { employeeId, pin } = req.body;
  try {
    const result = await AuthService.loginEmployee(employeeId, pin);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/auth/session - Session verification
router.get('/session', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated' });
  }
  res.json({ success: true, user: req.user });
});

export default router;
