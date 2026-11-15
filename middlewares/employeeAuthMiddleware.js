const authMiddleware = require('./authMiddleware');

module.exports = (req, res, next) => authMiddleware(req, res, () => {
  if (req.user?.role?.slug !== 'employee') {
    return res.status(403).json({ success: false, message: 'Access denied. Employee access is required.' });
  }
  return next();
});
