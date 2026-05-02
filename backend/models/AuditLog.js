const mongoose = require('mongoose');

// Lightweight audit trail for sensitive admin actions — useful for
// post-incident forensics and "who deleted that order?" questions.
// Capped collection so it self-trims and never grows unbounded.
const auditLogSchema = new mongoose.Schema({
  actor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email:   { type: String, default: '' },          // denormalized so the trail still reads even if the user is later deleted
  ip:      { type: String, default: '' },
  action:  { type: String, required: true },        // e.g. 'order.delete', 'user.role-change', 'product.delete'
  target:  { type: String, default: '' },           // id of the affected record
  details: { type: mongoose.Schema.Types.Mixed },   // arbitrary context (small)
}, { timestamps: { createdAt: 'at', updatedAt: false }, capped: { size: 5 * 1024 * 1024, max: 50000 } });

auditLogSchema.index({ at: -1 });
auditLogSchema.index({ actor: 1, at: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
