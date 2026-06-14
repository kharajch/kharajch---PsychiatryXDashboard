import mongoose, { Schema } from 'mongoose';
import { Assessment as IAssessment } from '../../types';

const AssessmentSchema = new Schema<IAssessment>({
  id: { type: String, required: true, unique: true, index: true }, // UUIDv4
  clinicId: { type: String, required: true, index: true },
  updatedAt: { type: Number, required: true, index: true },
  deleted: { type: Boolean, required: true, default: false },
  _rev: { type: String, required: true },

  patientId: { type: String, required: true, index: true }, // Patient UUID
  type: { type: String, required: true, index: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  severityLabel: { type: String, required: true },
  answers: { type: [Number], required: true },
  domainScores: {
    type: Map,
    of: new Schema({ score: Number, max: Number }, { _id: false }),
    required: true
  },
  alerts: {
    type: [new Schema({ type: String, message: String }, { _id: false })],
    required: true
  },
  duration: { type: Number, required: true }, // in seconds
  date: { type: String, required: true },
  clinician: { type: String, required: true },
  notes: { type: String, default: '' }
});

export const Assessment = mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', AssessmentSchema);
