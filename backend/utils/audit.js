const AuditLog = require('../models/AuditLog');

// Fire-and-forget audit logger used by sensitive admin routes. Failure to
// write the log must NEVER block the actual operation, so all errors are
// swallowed and just logged to the server console.
//
// Usage:
//   audit(req, 'order.delete', orderId, { reason });
async function audit(req, action, target = '', details = undefined) {
  try {
    await AuditLog.create({
      actor: req.user?._id,
      email: req.user?.email || '',
      ip: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || '',
      action,
      target: String(target || ''),
      details,
    });
  } catch (err) {
    console.warn('Audit log write failed:', err.message);
  }
}

module.exports = { audit };
