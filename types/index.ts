export interface SyncMetadata {
  id: string; // UUIDv4 primary key
  clinicId: string; // multi-tenancy scoping
  updatedAt: number; // Unix timestamp in milliseconds
  deleted: boolean; // soft-delete flag
  _rev: string; // revision tag (e.g. "1-hash")
}

export interface Patient extends SyncMetadata {
  name: string;
  patientId: string | null;
  age: number;
  gender: string;
  phone: string | null;
  email: string | null;
  dob: string | null;
  referral: string | null;
  complaint: string | null;
  history: string | null;
  medications: string | null;
  allergies: string | null;
  registeredOn: string;
}

export interface DomainScore {
  score: number;
  max: number;
}

export interface AssessmentAlert {
  type: string;
  message: string;
}

export interface Assessment extends SyncMetadata {
  patientId: string; // Patient UUID
  type: string;
  score: number;
  maxScore: number;
  severityLabel: string;
  answers: number[];
  domainScores: Record<string, DomainScore>;
  alerts: AssessmentAlert[];
  duration: number; // in seconds
  date: string;
  clinician: string;
  notes: string;
}

export interface Medicine {
  id: number; // Local item id (counter)
  name: string;
  frequency: string;
  timing: string;
  duration: string;
  instructions: string;
}

export interface Prescription extends SyncMetadata {
  patientId: string; // Patient UUID
  date: string;
  diagnosis: string;
  notes: string;
  followup: string;
  investigations: string;
  patientInstructions: string;
  medicines: Medicine[];
}

export interface User {
  id: string;
  username: string;
  name: string;
  clinicId: string;
  role: 'admin' | 'clinician' | 'staff';
  createdAt: string;
}
