export function requirePermission(requiredPermission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { permissions, role } = req.user;
    if (role === 'Executive' || (permissions && (permissions.includes('*') || permissions.includes(requiredPermission)))) {
      return next();
    }

    return res.status(403).json({ success: false, message: `Access denied. Requires permission: ${requiredPermission}` });
  };
}
