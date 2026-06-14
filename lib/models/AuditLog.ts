import mongoose, { Schema } from 'mongoose';

const AuditLogSchema = new Schema({
  clinicId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  details: { type: String, default: '' }
});

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
