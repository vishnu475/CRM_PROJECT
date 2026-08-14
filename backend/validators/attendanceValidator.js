export const validatePunchPayload = (req, res, next) => {
  const { employeeId } = req.body;
  if (!employeeId) {
    return res.status(400).json({ success: false, message: 'Employee ID is required.' });
  }
  next();
};
