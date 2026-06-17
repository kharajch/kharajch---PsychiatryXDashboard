'use client';

import React, { useMemo } from 'react';
import { FaFilePdf } from 'react-icons/fa';
import { Patient, Assessment } from '../../types';
import { ASSESSMENTS } from '../../lib/assessments-data';
import { generateAssessmentPDF } from '../../lib/pdf-utils';
import styles from './ReportsGenerator.module.css';

interface ReportsGeneratorProps {
  patients: Patient[];
  assessments: Assessment[];
  isTestEnv: boolean;
}

export default function ReportsGenerator({
  patients,
  assessments
}: ReportsGeneratorProps) {
  
  const activeAssessments = useMemo(() => {
    return assessments.filter(a => !a.deleted).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [assessments]);

  const handleExportPDF = (assess: Assessment) => {
    const p = patients.find(p => p.id === assess.patientId);
    if (!p) {
      alert('Patient record not found');
      return;
    }
    generateAssessmentPDF(assess, p);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Clinical Diagnostic Reports</h1>

      <div className="card">
        <div className="table-responsive">
          <table className={styles.reportTable}>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Assessment Scale</th>
                <th>Score</th>
                <th>Severity</th>
                <th>Completed On</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeAssessments.map(assess => {
                const p = patients.find(p => p.id === assess.patientId);
                const scale = ASSESSMENTS[assess.type];
                return (
                  <tr key={assess.id}>
                    <td style={{ fontWeight: 600, color: 'white' }}>{p ? p.name : 'Unknown Patient'}</td>
                    <td>{scale ? scale.name : assess.type.toUpperCase()} ({scale ? scale.short : assess.type})</td>
                    <td>{assess.score} / {assess.maxScore}</td>
                    <td>
                      <span 
                        className={`badge ${scale?.thresholds.find(t => t.label === assess.severityLabel)?.badge || 'badge-minimal'}`}
                        style={{ border: '1px solid currentColor' }}
                      >
                        {assess.severityLabel}
                      </span>
                    </td>
                    <td>{new Date(assess.date).toLocaleString()}</td>
                    <td>
                      <div className={styles.actionCell}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleExportPDF(assess)}>
                          <FaFilePdf /> Export PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {activeAssessments.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No assessments completed in the clinic database yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
