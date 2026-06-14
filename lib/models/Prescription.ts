import mongoose, { Schema } from 'mongoose';
import { Prescription as IPrescription } from '../../types';

const MedicineSchema = new Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  frequency: { type: String, required: true },
  timing: { type: String, required: true },
  duration: { type: String, required: true },
  instructions: { type: String, default: '' }
}, { _id: false });

const PrescriptionSchema = new Schema<IPrescription>({
  id: { type: String, required: true, unique: true, index: true }, // UUIDv4
  clinicId: { type: String, required: true, index: true },
  updatedAt: { type: Number, required: true, index: true },
  deleted: { type: Boolean, required: true, default: false },
  _rev: { type: String, required: true },

  patientId: { type: String, required: true, index: true }, // Patient UUID
  date: { type: String, required: true },
  diagnosis: { type: String, default: '' },
  notes: { type: String, default: '' },
  followup: { type: String, default: '' },
  investigations: { type: String, default: '' },
  patientInstructions: { type: String, default: '' },
  medicines: { type: [MedicineSchema], required: true }
});

export const Prescription = mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
