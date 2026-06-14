import mongoose, { Schema } from 'mongoose';
import { Patient as IPatient } from '../../types';

const PatientSchema = new Schema<IPatient>({
  id: { type: String, required: true, unique: true, index: true }, // UUIDv4
  clinicId: { type: String, required: true, index: true },
  updatedAt: { type: Number, required: true, index: true },
  deleted: { type: Boolean, required: true, default: false },
  _rev: { type: String, required: true },

  name: { type: String, required: true },
  patientId: { type: String, default: null, index: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  phone: { type: String, default: null },
  email: { type: String, default: null },
  dob: { type: String, default: null },
  referral: { type: String, default: null },
  complaint: { type: String, default: null },
  history: { type: String, default: null },
  medications: { type: String, default: null },
  allergies: { type: String, default: null },
  registeredOn: { type: String, required: true }
});

export const Patient = mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);
