import './setup-env';
import { test, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { connectToDatabase } from '../lib/mongodb';
import { AuditLog } from '../lib/models/AuditLog';
import { Patient } from '../lib/models/Patient';

test.describe('PsychiatryX Dashboard API Integration Tests', () => {
  let authToken: string;
  let otherAuthToken: string;
  const patientId = 'test-patient-' + Math.floor(Math.random() * 100000);

  test.beforeAll(async ({ request }) => {
    // 1. Ensure the DB is seeded using the dev seed endpoint
    const seedRes = await request.get('/api/dev/seed');
    expect(seedRes.status()).toBe(200);

    // 2. Log in using POST /api/auth/login
    const loginRes = await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'password123'
      }
    });
    expect(loginRes.status()).toBe(200);
    const loginData = await loginRes.json();
    authToken = loginData.token;
    expect(authToken).toBeDefined();

    // 3. Generate a mock token for a different clinic to test multi-tenancy isolation
    // We can sign a custom token using NextAuth JWT encoder because we have the secret
    otherAuthToken = await encode({
      token: {
        id: 'other-user-id',
        name: 'Other Clinician',
        email: 'other@clinic.com',
        clinicId: 'other-clinic-id',
        role: 'clinician'
      },
      secret: process.env.NEXTAUTH_SECRET || '',
      maxAge: 30 * 24 * 60 * 60
    });
  });

  test('POST /api/auth/login should reject invalid credentials', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: {
        username: 'admin',
        password: 'wrongpassword'
      }
    });
    expect(res.status()).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Invalid credentials');
  });

  test('GET /api/sync/[collection] should require authentication', async ({ request }) => {
    const res = await request.get('/api/sync/patients', {
      headers: {
        'Authorization': 'Bearer invalid-token-value'
      }
    });
    expect(res.status()).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  test('GET & POST /api/sync/patients replication and audit logs', async ({ request }) => {
    // 1. Pull current patients (should include seeded patient Rohan Sharma)
    const pullRes = await request.get('/api/sync/patients', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    expect(pullRes.status()).toBe(200);
    const pullData = await pullRes.json();
    expect(pullData.documents).toBeDefined();
    expect(pullData.documents.length).toBeGreaterThan(0);
    const seededPatient = pullData.documents.find((d: any) => d.id === 'dev-patient-id');
    expect(seededPatient).toBeDefined();
    expect(seededPatient.name).toBe('Rohan Sharma');

    // 2. Push a new patient
    const newPatient = {
      id: patientId,
      name: 'Integration Test Patient',
      patientId: 'MKS-9999',
      age: 45,
      gender: 'Female',
      registeredOn: new Date().toISOString(),
      updatedAt: Date.now(),
      deleted: false,
      _rev: '1-rev',
      clinicId: 'dev-clinic-id' // Will be verified/overwritten on server
    };

    const pushRes = await request.post('/api/sync/patients', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        pushRow: [{
          newDocumentState: newPatient,
          assumedMasterState: null
        }]
      }
    });
    expect(pushRes.status()).toBe(200);
    const pushData = await pushRes.json();
    expect(pushData.conflicts).toHaveLength(0);

    // 3. Connect directly to MongoDB to verify data & HIPAA audit logs
    await connectToDatabase();
    
    // Check patient actually inserted
    const dbPatient = await Patient.findOne({ id: patientId });
    expect(dbPatient).not.toBeNull();
    expect(dbPatient!.name).toBe('Integration Test Patient');
    expect(dbPatient!.clinicId).toBe('dev-clinic-id');

    // Verify audit logs written for pull and push
    const pushAudit = await AuditLog.findOne({
      patientId: patientId,
      action: 'PUSH_PATIENTS',
      clinicId: 'dev-clinic-id'
    });
    expect(pushAudit).not.toBeNull();
    expect(pushAudit!.details).toContain(patientId);

    const pullAudit = await AuditLog.findOne({
      action: 'PULL_PATIENTS',
      clinicId: 'dev-clinic-id'
    });
    expect(pullAudit).not.toBeNull();
  });

  test('Sync should detect and return revision conflicts', async ({ request }) => {
    // 1. Send update with correct revision
    const updatePatient = {
      id: patientId,
      name: 'Updated Patient Name',
      patientId: 'MKS-9999',
      age: 46,
      gender: 'Female',
      registeredOn: new Date().toISOString(),
      updatedAt: Date.now(),
      deleted: false,
      _rev: '2-rev'
    };

    const pushRes1 = await request.post('/api/sync/patients', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        pushRow: [{
          newDocumentState: updatePatient,
          assumedMasterState: { id: patientId, _rev: '1-rev' }
        }]
      }
    });
    expect(pushRes1.status()).toBe(200);
    const pushData1 = await pushRes1.json();
    expect(pushData1.conflicts).toHaveLength(0);

    // 2. Fetch current master doc to see the server revision
    await connectToDatabase();
    const dbPatient = await Patient.findOne({ id: patientId }).lean();
    const serverRev = (dbPatient as any)._rev;

    // 3. Send concurrent update with stale assumedMasterState (using 1-rev when server is already updated)
    const conflictPatient = {
      id: patientId,
      name: 'Conflict Patient Name',
      patientId: 'MKS-9999',
      age: 50,
      gender: 'Female',
      registeredOn: new Date().toISOString(),
      updatedAt: Date.now(),
      deleted: false,
      _rev: '3-rev'
    };

    const pushRes2 = await request.post('/api/sync/patients', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        pushRow: [{
          newDocumentState: conflictPatient,
          assumedMasterState: { id: patientId, _rev: '1-rev' } // Outdated assumed master
        }]
      }
    });
    expect(pushRes2.status()).toBe(200);
    const pushData2 = await pushRes2.json();
    expect(pushData2.conflicts).toHaveLength(1);
    expect(pushData2.conflicts[0].id).toBe(patientId);
    expect(pushData2.conflicts[0]._rev).toBe(serverRev); // Conflicted with the master's version
  });

  test('Sync endpoints must enforce strict tenant boundaries', async ({ request }) => {
    // 1. Pull with Clinic B (otherAuthToken)
    // Rohan Sharma (dev-clinic-id) and patientId (dev-clinic-id) should NOT be returned
    const pullResOther = await request.get('/api/sync/patients', {
      headers: {
        'Authorization': `Bearer ${otherAuthToken}`
      }
    });
    expect(pullResOther.status()).toBe(200);
    const pullDataOther = await pullResOther.json();
    const hasDevPatient = pullDataOther.documents.some((d: any) => d.id === 'dev-patient-id' || d.id === patientId);
    expect(hasDevPatient).toBe(false);

    // 2. Push a patient to Clinic B
    const otherPatientId = 'other-clinic-patient-id';
    const otherPatient = {
      id: otherPatientId,
      name: 'Other Clinic Patient',
      patientId: 'MKS-8888',
      age: 22,
      gender: 'Male',
      registeredOn: new Date().toISOString(),
      updatedAt: Date.now(),
      deleted: false,
      _rev: '1-rev'
    };

    const pushResOther = await request.post('/api/sync/patients', {
      headers: {
        'Authorization': `Bearer ${otherAuthToken}`
      },
      data: {
        pushRow: [{
          newDocumentState: otherPatient,
          assumedMasterState: null
        }]
      }
    });
    expect(pushResOther.status()).toBe(200);

    // 3. Verify server enforced other-clinic-id on the document
    await connectToDatabase();
    const dbOtherPatient = await Patient.findOne({ id: otherPatientId });
    expect(dbOtherPatient).not.toBeNull();
    expect(dbOtherPatient!.clinicId).toBe('other-clinic-id'); // Ensured server-side injection

    // 4. Pull with Clinic A (authToken) and verify it CANNOT see Clinic B's patient
    const pullResOriginal = await request.get('/api/sync/patients', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    expect(pullResOriginal.status()).toBe(200);
    const pullDataOriginal = await pullResOriginal.json();
    const hasOtherPatient = pullDataOriginal.documents.some((d: any) => d.id === otherPatientId);
    expect(hasOtherPatient).toBe(false);
  });

  test('GET /api/sync/patients should respect limit and return correct checkpoint', async ({ request }) => {
    // 1. Create multiple patients to test batching
    const patientsToCreate = [];
    for (let i = 0; i < 5; i++) {
      patientsToCreate.push({
        newDocumentState: {
          id: `batch-patient-${i}-${Math.random().toString(36).substring(7)}`,
          name: `Batch Patient ${i}`,
          registeredOn: new Date().toISOString(),
          updatedAt: Date.now() + i, // staggered timestamps
          deleted: false,
          _rev: '1-rev'
        },
        assumedMasterState: null
      });
    }

    await request.post('/api/sync/patients', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: { pushRow: patientsToCreate }
    });

    // 2. Pull with limit = 2
    const pullRes1 = await request.get('/api/sync/patients?limit=2', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    expect(pullRes1.status()).toBe(200);
    const pullData1 = await pullRes1.json();
    expect(pullData1.documents.length).toBe(2);
    
    const checkpoint1 = pullData1.checkpoint;
    expect(checkpoint1.updatedAt).toBeDefined();
    expect(checkpoint1.id).toBe(pullData1.documents[1].id);

    // 3. Pull next batch using checkpoint
    const pullRes2 = await request.get(`/api/sync/patients?limit=2&updatedAt=${checkpoint1.updatedAt}&lastId=${checkpoint1.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    expect(pullRes2.status()).toBe(200);
    const pullData2 = await pullRes2.json();
    expect(pullData2.documents.length).toBe(2);
    expect(pullData2.documents[0].id).not.toBe(pullData1.documents[0].id);
    expect(pullData2.documents[0].id).not.toBe(pullData1.documents[1].id);
  });
});
