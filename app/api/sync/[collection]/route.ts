import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import { getClinicSession } from '../../../../lib/auth';
import { Patient } from '../../../../lib/models/Patient';
import { Assessment } from '../../../../lib/models/Assessment';
import { Prescription } from '../../../../lib/models/Prescription';
import { AuditLog } from '../../../../lib/models/AuditLog';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function corsResponse(data: any, init: ResponseInit = {}) {
  const status = init.status || 200;
  return NextResponse.json(data, {
    status,
    headers: { ...corsHeaders, ...init.headers },
  });
}

function getModel(collection: string) {
  switch (collection) {
    case 'patients':
      return Patient;
    case 'assessments':
      return Assessment;
    case 'prescriptions':
      return Prescription;
    default:
      return null;
  }
}

// OPTIONS preflight handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET - Pull replication endpoint
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getClinicSession(req);
    if (!session || !session.clinicId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collection } = await params;
    const model = getModel(collection);
    if (!model) {
      return corsResponse({ error: 'Invalid collection' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const updatedAt = Number(searchParams.get('updatedAt') || '0');
    const lastId = searchParams.get('lastId') || '';
    const limit = Math.min(Number(searchParams.get('limit') || '100'), 500);

    // Query documents updated after checkpoint, sorted by updatedAt and id
    // We enforce clinicId scoping for security/multi-tenancy
    const query = {
      clinicId: session.clinicId,
      $or: [
        { updatedAt: { $gt: updatedAt } },
        { updatedAt, id: { $gt: lastId } }
      ]
    };

    const documents = await model
      .find(query)
      .sort({ updatedAt: 1, id: 1 })
      .limit(limit)
      .lean();

    // Map _id to id or ensure id field is returned
    const formattedDocs = documents.map((doc: any) => {
      const { _id, __v, ...rest } = doc;
      return rest;
    });

    // Compute new checkpoint based on last document returned
    let newCheckpoint = { updatedAt, id: lastId };
    if (formattedDocs.length > 0) {
      const lastDoc = formattedDocs[formattedDocs.length - 1];
      newCheckpoint = {
        updatedAt: lastDoc.updatedAt,
        id: lastDoc.id
      };
    }

    // Log the read action for PHI auditing if documents were returned
    if (formattedDocs.length > 0) {
      await AuditLog.create({
        clinicId: session.clinicId,
        userId: session.id || 'unknown',
        patientId: collection === 'patients' ? 'batch' : (formattedDocs[0].patientId || 'batch'),
        action: `PULL_${collection.toUpperCase()}`,
        details: `Pulled ${formattedDocs.length} records. Checkpoint: ${newCheckpoint.updatedAt}`
      });
    }

    return corsResponse({
      documents: formattedDocs,
      checkpoint: newCheckpoint
    });
  } catch (error: any) {
    console.error('Pull sync error:', error);
    return corsResponse({ 
      error: 'Internal Server Error', 
      message: error.message,
      collection: (await params).collection
    }, { status: 500 });
  }
}

// POST - Push replication endpoint
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getClinicSession(req);
    if (!session || !session.clinicId) {
      return corsResponse({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collection } = await params;
    const model = getModel(collection);
    if (!model) {
      return corsResponse({ error: 'Invalid collection' }, { status: 400 });
    }

    const body = await req.json();
    const pushRows = body.pushRow || [];
    const conflicts: any[] = [];

    // Process row by row for conflict detection and writes
    for (const row of pushRows) {
      const { newDocumentState, assumedMasterState } = row;
      const docId = newDocumentState.id;

      // 1. Fetch current master doc state from MongoDB
      const masterDoc = await model.findOne({ id: docId, clinicId: session.clinicId }).lean();

      // 2. Check for conflicts
      if (masterDoc) {
        const hasConflict = assumedMasterState 
          ? (masterDoc as any)._rev !== assumedMasterState._rev
          : true; // if client assumed no master but it exists, it's a conflict

        if (hasConflict) {
          const { _id, __v, ...cleanMaster } = masterDoc as any;
          conflicts.push(cleanMaster);
          continue; // skip writing this document, client must resolve
        }
      }

      // 3. No conflict: Save the new state
      // Ensure clinicId scoping is enforced
      newDocumentState.clinicId = session.clinicId;
      
      // Update updatedAt timestamp to server time to keep sync ordered correctly
      newDocumentState.updatedAt = Date.now();

      // Upsert document
      await model.updateOne(
        { id: docId, clinicId: session.clinicId },
        { $set: newDocumentState },
        { upsert: true }
      );

      // Audit Log for PHI write
      await AuditLog.create({
        clinicId: session.clinicId,
        userId: session.id || 'unknown',
        patientId: collection === 'patients' ? docId : (newDocumentState.patientId || docId),
        action: `PUSH_${collection.toUpperCase()}`,
        details: `Pushed record id: ${docId}. Deleted: ${newDocumentState.deleted}`
      });
    }

    return corsResponse({ conflicts });
  } catch (error: any) {
    console.error('Push sync error:', error);
    return corsResponse({ 
      error: 'Internal Server Error', 
      message: error.message,
      collection: (await params).collection
    }, { status: 500 });
  }
}
