import { createRxDatabase, addRxPlugin, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { replicateRxCollection, RxReplicationState } from 'rxdb/plugins/replication';

let replicationStates: Record<string, RxReplicationState<any, any>> = {};

// Register plugins
try {
  addRxPlugin(RxDBQueryBuilderPlugin);
} catch (e) {
  // Ignore plugin re-registration errors in development HMR
}

const patientSchema = {
  title: 'patient schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    clinicId: { type: 'string' },
    updatedAt: { type: 'number' },
    deleted: { type: 'boolean' },
    _rev: { type: 'string' },
    name: { type: 'string' },
    patientId: { type: ['string', 'null'] },
    age: { type: 'number' },
    gender: { type: 'string' },
    phone: { type: ['string', 'null'] },
    email: { type: ['string', 'null'] },
    dob: { type: ['string', 'null'] },
    referral: { type: ['string', 'null'] },
    complaint: { type: ['string', 'null'] },
    history: { type: ['string', 'null'] },
    medications: { type: ['string', 'null'] },
    allergies: { type: ['string', 'null'] },
    registeredOn: { type: 'string' }
  },
  required: ['id', 'clinicId', 'updatedAt', 'deleted', '_rev', 'name', 'registeredOn']
};

const assessmentSchema = {
  title: 'assessment schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    clinicId: { type: 'string' },
    updatedAt: { type: 'number' },
    deleted: { type: 'boolean' },
    _rev: { type: 'string' },
    patientId: { type: 'string' },
    type: { type: 'string' },
    score: { type: 'number' },
    maxScore: { type: 'number' },
    severityLabel: { type: 'string' },
    answers: { type: 'array', items: { type: 'number' } },
    domainScores: { type: 'object' },
    alerts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          message: { type: 'string' }
        }
      }
    },
    duration: { type: 'number' },
    date: { type: 'string' },
    clinician: { type: 'string' },
    notes: { type: 'string' }
  },
  required: ['id', 'clinicId', 'updatedAt', 'deleted', '_rev', 'patientId', 'type', 'score', 'maxScore', 'severityLabel', 'answers', 'date']
};

const prescriptionSchema = {
  title: 'prescription schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    clinicId: { type: 'string' },
    updatedAt: { type: 'number' },
    deleted: { type: 'boolean' },
    _rev: { type: 'string' },
    patientId: { type: 'string' },
    date: { type: 'string' },
    diagnosis: { type: 'string' },
    notes: { type: 'string' },
    followup: { type: 'string' },
    investigations: { type: 'string' },
    patientInstructions: { type: 'string' },
    medicines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          frequency: { type: 'string' },
          timing: { type: 'string' },
          duration: { type: 'string' },
          instructions: { type: 'string' }
        }
      }
    }
  },
  required: ['id', 'clinicId', 'updatedAt', 'deleted', '_rev', 'patientId', 'date']
};

const getDbName = () => {
  if (typeof window === 'undefined') return 'psychiatryx_rxdb_v17';
  
  const isTest = (navigator.webdriver || window.location.search.includes('test=true')) && !window.location.search.includes('test=false');
  const isAutomation = !!navigator.webdriver;
  
  if (isTest || isAutomation) {
    const _global = (window as any);
    if (!_global.__PSYCHIATRYX_DB_TEST_NAME__) {
      const suffix = Math.random().toString(36).substring(7);
      _global.__PSYCHIATRYX_DB_TEST_NAME__ = `psychiatryx_rxdb_test_${suffix}`;
    }
    return _global.__PSYCHIATRYX_DB_TEST_NAME__;
  }
  
  return 'psychiatryx_rxdb_v17';
};
const DB_NAME = getDbName();

export async function getRxDB(): Promise<RxDatabase> {
  if (typeof window === 'undefined') {
    throw new Error('RxDB can only be initialized on the client side.');
  }

  const _global = (window as any);
  console.log("DEBUG getRxDB call. Cache exists:", !!_global.__PSYCHIATRYX_RXDB_PROMISE__);
  if (_global.__PSYCHIATRYX_RXDB_PROMISE__) return _global.__PSYCHIATRYX_RXDB_PROMISE__;

  _global.__PSYCHIATRYX_RXDB_PROMISE__ = (async () => {
    try {
      let db;
      let retries = 0;
      while (retries < 5) {
        try {
          db = await createRxDatabase({
            name: DB_NAME,
            storage: getRxStorageDexie(),
            ignoreDuplicate: false
          });
          break;
        } catch (err: any) {
          console.error("DEBUG RxDB error:", err, err.stack);
          if (err.message && (err.message.includes('DB9') || err.code === 'DB9')) {
            console.warn(`RxDB duplicate database lock (DB9) detected. Retrying in 200ms... (Attempt ${retries + 1}/5)`);
            await new Promise(resolve => setTimeout(resolve, 200));
            retries++;
          } else {
            throw err;
          }
        }
      }
      if (!db) {
        throw new Error("Failed to initialize RxDB: Max retries exceeded due to DB9 database locks.");
      }

      // Register collections
      await db.addCollections({
        patients: { schema: patientSchema },
        assessments: { schema: assessmentSchema },
        prescriptions: { schema: prescriptionSchema }
      });

      // Defensive cleanup for HMR deleted$ RxDB issue
      const collections = ['patients', 'assessments', 'prescriptions'] as const;
      collections.forEach(col => {
        const c = (db as any)[col];
        if (c && c.constructor.prototype) {
          try {
            delete c.constructor.prototype.deleted$;
          } catch (e) {
            // Ignore
          }
        }
      });

      return db;
    } catch (err) {
      delete _global.__PSYCHIATRYX_RXDB_PROMISE__;
      throw err;
    }
  })();

  return _global.__PSYCHIATRYX_RXDB_PROMISE__;
}

export async function factoryReset() {
  if (typeof window === 'undefined') return;
  try {
    const db = await getRxDB();
    if (db && typeof (db as any).destroy === 'function') {
      await (db as any).destroy();
    }
  } catch (e) {
    // Ignore if not initialized
  }
  
  // Clean up both possible database names
  indexedDB.deleteDatabase('psychiatryx_rxdb');
  const req = indexedDB.deleteDatabase(DB_NAME);
  
  if (typeof window !== 'undefined') {
    delete (window as any).__PSYCHIATRYX_RXDB_PROMISE__;
  }
  
  return new Promise<void>((resolve, reject) => {
    req.onsuccess = () => {
      localStorage.clear();
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

function getCleanErrorMessage(err: any): string {
  if (!err) return 'Connection lost';
  
  let innerMsg = '';
  if (err.parameters && err.parameters.errors) {
    const errors = err.parameters.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      innerMsg = errors[0].message || errors[0].name || '';
    } else if (errors && (errors.message || errors.name)) {
      innerMsg = errors.message || errors.name;
    } else if (typeof errors === 'string') {
      innerMsg = errors;
    }
  }
  
  const mainMsg = err.message || '';
  const finalMsg = innerMsg || mainMsg || String(err);
  
  const lower = finalMsg.toLowerCase();
  if (lower.includes('failed to fetch') || 
      lower.includes('networkerror') || 
      lower.includes('fetch') || 
      lower.includes('network error') ||
      lower.includes('failed to connect') ||
      lower.includes('abort') ||
      lower.includes('aborted')) {
    return 'offline (local only)';
  }
  return finalMsg;
}

export function setupClientReplication(
  db: RxDatabase,
  token: string | null,
  onStatusChange: (status: 'offline' | 'syncing' | 'online' | 'error', message: string) => void
) {
  const isTest = typeof navigator !== 'undefined' && (navigator.webdriver || window.location.search.includes('test=true')) && !window.location.search.includes('test=false');
  if (!token && !isTest) {
    onStatusChange('offline', 'Sign in to sync with cloud');
    return;
  }

  // Cancel existing replications
  Object.values(replicationStates).forEach(rep => rep.cancel());
  replicationStates = {};

  const serverUrl = window.location.origin; // Same origin on Next.js deployment
  const collections = ['patients', 'assessments', 'prescriptions'] as const;
  let activeReplications = 0;
  const activeStates: Record<string, boolean> = {};
  const errorStates: Record<string, any> = {};

  collections.forEach(col => {
    try {
      const colObj = db[col];
      if (!colObj) return;

      if (colObj.constructor.prototype) {
        try {
          delete colObj.constructor.prototype.deleted$;
        } catch (e) {}
      }

      const repState = replicateRxCollection({
        collection: colObj,
        replicationIdentifier: `nextjs-replication-${col}`,
        live: true,
        retryTime: 5000,
        pull: {
          batchSize: 100,
          modifier: (doc) => {
            doc._deleted = !!doc.deleted;
            return doc;
          },
          handler: async (lastCheckpoint, batchSize) => {
            const headers: Record<string, string> = {};
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            const updatedAt = lastCheckpoint ? (lastCheckpoint as any).updatedAt : 0;
            const lastId = lastCheckpoint ? (lastCheckpoint as any).id : '';
            const url = `${serverUrl}/api/sync/${col}?updatedAt=${updatedAt}&lastId=${lastId}&limit=${batchSize}`;
            
            const res = await fetch(url, { headers });
            if (!res.ok) {
              throw new Error(`Pull HTTP error ${res.status}`);
            }
            const data = await res.json();
            return {
              documents: data.documents,
              checkpoint: data.checkpoint
            };
          }
        },
        push: {
          batchSize: 100,
          modifier: (doc) => {
            const newDoc = { ...doc };
            newDoc.deleted = !!newDoc._deleted;
            delete newDoc._deleted;
            return newDoc;
          },
          handler: async (pushRows) => {
            const headers: Record<string, string> = {
              'Content-Type': 'application/json'
            };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            const cleanPushRows = pushRows.map(row => {
              const newDoc = { ...row.newDocumentState };
              if ('_deleted' in newDoc) {
                newDoc.deleted = !!newDoc._deleted;
                delete newDoc._deleted;
              }

              let assumed = null;
              if (row.assumedMasterState) {
                assumed = { ...row.assumedMasterState };
                if ('_deleted' in assumed) {
                  assumed.deleted = !!assumed._deleted;
                  delete assumed._deleted;
                }
              }

              return {
                newDocumentState: newDoc,
                assumedMasterState: assumed
              };
            });

            const url = `${serverUrl}/api/sync/${col}`;
            const res = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify({ pushRow: cleanPushRows })
            });

            if (!res.ok) {
              throw new Error(`Push HTTP error ${res.status}`);
            }

            const data = await res.json();
            const cleanConflicts = (data.conflicts || []).map((c: any) => {
              c._deleted = !!c.deleted;
              return c;
            });

            return cleanConflicts;
          }
        }
      });

      replicationStates[col] = repState;
      activeReplications++;

      repState.error$.subscribe(err => {
        console.error(`Replication error on ${col}:`, err);
        errorStates[col] = err;
        const cleanMsg = getCleanErrorMessage(err);
        if (cleanMsg === 'offline (local only)') {
          onStatusChange('offline', 'Sync offline (local only)');
        } else {
          onStatusChange('error', `Sync error on ${col}: ${cleanMsg}`);
        }
      });

      repState.active$.subscribe(active => {
        activeStates[col] = active;
        if (active) {
          delete errorStates[col];
        }
        
        const anyError = Object.keys(errorStates).length > 0;
        const anyActive = Object.values(activeStates).some(act => act);
        
        if (anyError) {
          const firstCol = Object.keys(errorStates)[0];
          const cleanMsg = getCleanErrorMessage(errorStates[firstCol]);
          if (cleanMsg === 'offline (local only)') {
            onStatusChange('offline', 'Sync offline (local only)');
          } else {
            onStatusChange('error', `Sync error in background: ${cleanMsg}`);
          }
        } else if (anyActive) {
          onStatusChange('syncing', 'Syncing data...');
        } else {
          onStatusChange('online', 'Connected & Synced');
        }
      });
    } catch (e) {
      console.error(`Replication setup error for ${col}:`, e);
      errorStates[col] = e;
      const cleanMsg = getCleanErrorMessage(e);
      if (cleanMsg === 'offline (local only)') {
        onStatusChange('offline', 'Sync offline (local only)');
      } else {
        onStatusChange('error', `Sync setup failed for ${col}: ${cleanMsg}`);
      }
    }
  });

  if (activeReplications === 0) {
    onStatusChange('offline', 'Sync offline (local only)');
  }
}
