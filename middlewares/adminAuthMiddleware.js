const authMiddleware = require('./authMiddleware');

module.exports = (req, res, next) => authMiddleware(req, res, () => {
  if (!['super-admin', 'admin'].includes(req.user?.role?.slug)) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator access is required.' });
  }
  return next();
});
