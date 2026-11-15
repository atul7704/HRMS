const authMiddleware = require('./authMiddleware');

module.exports = (req, res, next) => authMiddleware(req, res, () => {
  if (req.user?.role?.slug !== 'company') {
    return res.status(403).json({ success: false, message: 'Access denied. Company access is required.' });
  }
  return next();
});
