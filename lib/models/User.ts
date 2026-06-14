import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true }, // UUIDv4
  username: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  clinicId: { type: String, required: true, index: true },
  role: { type: String, enum: ['admin', 'clinician', 'staff'], default: 'clinician' },
  createdAt: { type: String, required: true }
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
