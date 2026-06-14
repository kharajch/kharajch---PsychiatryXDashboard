import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../../../lib/mongodb';
import { User } from '../../../../lib/models/User';
import { Patient } from '../../../../lib/models/Patient';
import { Assessment } from '../../../../lib/models/Assessment';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    await connectToDatabase();

    // 1. Create dev user if it doesn't exist
    const devUsername = 'admin';
    const devPassword = 'password123';
    let user = await User.findOne({ username: devUsername });

    if (!user) {
      const passwordHash = await bcrypt.hash(devPassword, 10);
      user = await User.create({
        id: 'dev-user-id',
        username: devUsername,
        passwordHash,
        name: 'Demo Doctor',
        clinicId: 'dev-clinic-id',
        role: 'clinician',
        createdAt: new Date().toISOString()
      });
    } else {
      // update hash if exists just to make sure password123 is valid
      const passwordHash = await bcrypt.hash(devPassword, 10);
      user.passwordHash = passwordHash;
      await user.save();
    }

    // 2. Create a dev patient if not exists
    let patient = await Patient.findOne({ id: 'dev-patient-id' });
    if (!patient) {
      patient = await Patient.create({
        id: 'dev-patient-id',
        clinicId: 'dev-clinic-id',
        updatedAt: Date.now(),
        deleted: false,
        _rev: '1-patient-rev',
        name: 'Rohan Sharma',
        patientId: 'MKS-0001',
        age: 32,
        gender: 'Male',
        phone: '+91 9876543210',
        email: 'rohan.sharma@example.com',
        dob: '1994-05-12',
        referral: 'General Practitioner',
        complaint: 'Patient reports feeling persistent low mood, lack of energy, and sleep issues for the past 3 weeks.',
        history: 'No prior psychiatric history.',
        medications: 'None',
        allergies: 'NKDA',
        registeredOn: new Date().toISOString()
      });
    }

    // 3. Create a dev assessment if not exists
    let assessment = await Assessment.findOne({ id: 'dev-assess-id' });
    if (!assessment) {
      assessment = await Assessment.create({
        id: 'dev-assess-id',
        clinicId: 'dev-clinic-id',
        updatedAt: Date.now(),
        deleted: false,
        _rev: '1-assess-rev',
        patientId: 'dev-patient-id',
        type: 'depression',
        score: 18,
        maxScore: 51,
        severityLabel: 'Moderate Depression',
        answers: [1, 2, 1, 0, 2, 1, 1, 2, 0, 1, 2, 1, 1, 1, 1, 1, 0],
        domainScores: {},
        alerts: [{ type: 'score', message: 'Score 18 meets clinical alert threshold' }],
        duration: 240,
        date: new Date().toISOString(),
        clinician: 'Demo Doctor',
        notes: 'Advised lifestyle modifications and scheduled follow-up in 2 weeks.'
      });
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      credentials: {
        username: devUsername,
        password: devPassword
      },
      seededData: {
        userId: user.id,
        patientId: patient.id,
        assessmentId: assessment.id
      }
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
