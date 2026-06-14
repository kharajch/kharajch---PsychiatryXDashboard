import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import { Patient } from '../../../../lib/models/Patient';
import { Assessment } from '../../../../lib/models/Assessment';
import { Prescription } from '../../../../lib/models/Prescription';
import { AuditLog } from '../../../../lib/models/AuditLog';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development' && process.env.ALLOW_DB_RESET !== 'true') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  try {
    await connectToDatabase();

    const results = {
      patients: await Patient.deleteMany({}),
      assessments: await Assessment.deleteMany({}),
      prescriptions: await Prescription.deleteMany({}),
      auditLogs: await AuditLog.deleteMany({}),
    };

    return NextResponse.json({
      message: 'Database cleared successfully',
      results
    });
  } catch (error: any) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
