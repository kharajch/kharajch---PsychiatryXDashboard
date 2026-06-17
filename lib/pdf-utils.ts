import { jsPDF } from 'jspdf';
import { Patient, Assessment, Prescription } from '../types';
import { ASSESSMENTS } from './assessments-data';

export const generateAssessmentPDF = (assess: Assessment, patient: Patient) => {
  const doc = new jsPDF();
  const scale = ASSESSMENTS[assess.type];

  // PDF Header
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, 210, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PsychiatryX Clinical Report', 15, 20);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date(assess.date).toLocaleString()}`, 15, 28);
  doc.text(`Clinician: Dr. ${assess.clinician || 'Clinician'}`, 15, 34);

  // Patient info block
  doc.setFillColor(245, 245, 245);
  doc.rect(15, 55, 180, 28, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.text('PATIENT PROFILE:', 20, 62);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Name: ${patient.name}`, 20, 68);
  doc.text(`Age/Gender: ${patient.age} / ${patient.gender}`, 20, 74);
  doc.text(`Patient ID: ${patient.patientId || 'N/A'}`, 110, 68);
  doc.text(`Email/Phone: ${patient.email || 'N/A'} / ${patient.phone || 'N/A'}`, 110, 74);

  // Assessment info block
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(scale ? scale.name : assess.type.toUpperCase(), 15, 98);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Timeframe: ${scale ? scale.timeframe : 'N/A'}  |  Duration: ${assess.duration} seconds`, 15, 104);

  // Score Circle visual representation
  doc.setFillColor(230, 57, 70);
  doc.circle(45, 130, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`${assess.score}`, 45, 132, { align: 'center' });
  doc.setFontSize(8);
  doc.text(`Max: ${assess.maxScore}`, 45, 137, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(assess.severityLabel, 75, 128);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`A severity ranking calculated using standardized DSM-5 metrics.`, 75, 134);

  // Alerts Section
  let y = 160;
  if (assess.alerts && assess.alerts.length > 0) {
    doc.setFillColor(254, 226, 226); // Light red
    doc.rect(15, y, 180, 8 + (assess.alerts.length * 6), 'F');
    doc.setDrawColor(230, 57, 70);
    doc.rect(15, y, 180, 8 + (assess.alerts.length * 6), 'S');
    
    doc.setTextColor(230, 57, 70);
    doc.setFont('Helvetica', 'bold');
    doc.text('CLINICAL FLAGS / ALERTS DETECTED:', 20, y + 6);
    doc.setFont('Helvetica', 'normal');
    assess.alerts.forEach((alert, idx) => {
      doc.text(`• ${alert.message}`, 20, y + 12 + (idx * 6));
    });
    y += 18 + (assess.alerts.length * 6);
  } else {
    y += 15;
  }

  // Clinician Notes
  doc.setTextColor(0, 0, 0);
  doc.setFont('Helvetica', 'bold');
  doc.text('CLINICAL NOTES / OBSERVATIONS:', 15, y);
  doc.setFont('Helvetica', 'normal');
  const notesLines = doc.splitTextToSize(assess.notes || 'No clinical notes provided yet.', 180);
  doc.text(notesLines, 15, y + 6);

  y += 15 + (notesLines.length * 5);

  // Question response details header
  if (y > 250) {
    doc.addPage();
    y = 25;
  }
  doc.setFont('Helvetica', 'bold');
  doc.text('ITEMIZED RESPONSE LOG:', 15, y);
  doc.setFont('Helvetica', 'normal');
  y += 6;

  if (scale) {
    scale.questions.forEach((q, idx) => {
      const score = assess.answers[idx];
      const opt = scale.options.find(o => o.score === score);
      const qText = `${idx + 1}. ${q.text}`;
      const ansText = `Answer: ${score} - ${opt ? opt.label : 'N/A'}`;

      const splitQ = doc.splitTextToSize(qText, 120);
      
      if (y + (splitQ.length * 5) > 280) {
        doc.addPage();
        y = 25;
      }

      doc.text(splitQ, 15, y);
      doc.setFont('Helvetica', 'bold');
      doc.text(ansText, 140, y);
      doc.setFont('Helvetica', 'normal');
      
      y += (splitQ.length * 5) + 2;
    });
  }

  doc.save(`PsychiatryX_Report_${patient.name.replace(/\s+/g, '_')}_${scale?.short || 'Assessment'}.pdf`);
};

export const generatePrescriptionPDF = (presc: Prescription, patient: Patient) => {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PsychiatryX Prescription', 15, 20);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(presc.date).toLocaleDateString()}`, 15, 28);
  doc.text(`Clinic: PsychiatryX Clinical Hub`, 15, 34);

  // Patient Card
  doc.setFillColor(245, 245, 245);
  doc.rect(15, 55, 180, 28, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('Helvetica', 'bold');
  doc.text('PATIENT:', 20, 62);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Name: ${patient.name}`, 20, 68);
  doc.text(`Age/Gender: ${patient.age} / ${patient.gender}`, 20, 74);
  doc.text(`DOB: ${patient.dob || 'N/A'}`, 110, 68);
  doc.text(`Allergies: ${patient.allergies || 'None Reported'}`, 110, 74);

  // Diagnosis
  doc.setFont('Helvetica', 'bold');
  doc.text('DIAGNOSIS / CLINICAL IMPRESSION:', 15, 98);
  doc.setFont('Helvetica', 'normal');
  doc.text(presc.diagnosis || 'Diagnosis deferred', 15, 104);

  doc.setFont('Helvetica', 'bold');
  doc.text('MEDICATIONS PRESCRIBED:', 15, 118);
  doc.setFont('Helvetica', 'normal');

  let y = 124;
  presc.medicines.forEach((med, idx) => {
    doc.setFont('Helvetica', 'bold');
    doc.text(`${idx + 1}. ${med.name}`, 15, y);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Dosage: ${med.frequency}  |  Timing: ${med.timing}  |  Duration: ${med.duration}`, 20, y + 5);
    if (med.instructions) {
      doc.text(`Instructions: ${med.instructions}`, 20, y + 10);
      y += 5;
    }
    y += 12;
  });

  if (presc.notes) {
    doc.setFont('Helvetica', 'bold');
    doc.text('CLINICAL ADVICE & INSTRUCTIONS:', 15, y);
    doc.setFont('Helvetica', 'normal');
    const noteLines = doc.splitTextToSize(presc.notes, 180);
    doc.text(noteLines, 15, y + 6);
    y += 10 + (noteLines.length * 5);
  }

  if (presc.followup) {
    doc.setFont('Helvetica', 'bold');
    doc.text(`FOLLOW UP: ${presc.followup}`, 15, y);
  }

  doc.save(`Prescription_${patient.name.replace(/\s+/g, '_')}_${new Date(presc.date).toISOString().split('T')[0]}.pdf`);
};

export const generateFullReportPDF = (patient: Patient, patientAssessments: Assessment[]) => {
  const doc = new jsPDF();
  const W = 210;
  const H = 297;

  // Header
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Comprehensive Clinical Report', 15, 20);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, 28);
  doc.text(`Tenancy: PsychiatryX Health Portal`, 15, 34);

  // Patient Card
  doc.setFillColor(245, 245, 245);
  doc.rect(15, 55, 180, 28, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('Helvetica', 'bold');
  doc.text('PATIENT PROFILE:', 20, 62);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Name: ${patient.name}`, 20, 68);
  doc.text(`Age/Gender: ${patient.age} / ${patient.gender}`, 20, 74);
  doc.text(`Patient ID: ${patient.patientId || 'N/A'}`, 110, 68);
  doc.text(`Registered On: ${new Date(patient.registeredOn).toLocaleDateString()}`, 110, 74);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ASSESSMENT HISTORY SUMMARY:', 15, 98);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');

  let y = 106;
  if (patientAssessments.length === 0) {
    doc.text('No completed rating scales logged for this patient.', 15, y);
  } else {
    patientAssessments.forEach((a, idx) => {
      const scale = ASSESSMENTS[a.type];
      if (y > 270) {
        doc.addPage();
        y = 25;
      }
      doc.setFont('Helvetica', 'bold');
      doc.text(`${scale ? scale.name : a.type.toUpperCase()}`, 15, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Date: ${new Date(a.date).toLocaleDateString()}  |  Score: ${a.score}/${a.maxScore} (${a.severityLabel})`, 15, y + 5);
      
      y += 12;

      if (a.notes) {
        const notesLines = doc.splitTextToSize(`Notes: ${a.notes}`, 180);
        doc.setTextColor(100, 116, 139);
        doc.text(notesLines, 18, y);
        doc.setTextColor(0, 0, 0);
        y += (notesLines.length * 5) + 4;
      }
    });
  }

  doc.save(`${patient.patientId || 'P' + patient.id}_Full_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
