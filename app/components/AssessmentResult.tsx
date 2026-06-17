'use client';

import React, { useState } from 'react';
import { FaExclamationTriangle, FaFilePdf, FaHistory, FaSpinner } from 'react-icons/fa';
import { Patient, Assessment } from '../../types';
import { ASSESSMENTS, getSeverity } from '../../lib/assessments-data';
import { generateAssessmentPDF } from '../../lib/pdf-utils';
import styles from './AssessmentResult.module.css';

interface AssessmentResultProps {
  activePatient: Patient;
  assessment: Assessment;
  onSaveNotes: (notes: string) => Promise<void>;
  onClose: () => void;
  isTestEnv: boolean;
}

export default function AssessmentResult({
  activePatient,
  assessment,
  onSaveNotes,
  onClose,
  isTestEnv
}: AssessmentResultProps) {
  const def = ASSESSMENTS[assessment.type];
  const severity = getSeverity(assessment.type, assessment.score);
  
  const [notes, setNotes] = useState(assessment.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await onSaveNotes(notes);
      alert('Clinical notes updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to update notes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    // Save notes first if changed
    if (notes !== (assessment.notes || '')) {
      await onSaveNotes(notes);
    }
    // Generate and download
    const updatedRecord = { ...assessment, notes };
    generateAssessmentPDF(updatedRecord, activePatient);
  };

  // Calculate severity marker position
  const maxScore = assessment.maxScore;
  const percentage = Math.min(Math.round((assessment.score / maxScore) * 100), 100);

  return (
    <div className={styles.container}>
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <span className="card-title">Assessment Results</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleDownloadPDF}>
              <FaFilePdf /> Save & Print PDF
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              <FaHistory /> Return to Patient Profile
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className={styles.scoreDisplay}>
            {/* Score Circle */}
            <div 
              className={styles.scoreCircle} 
              style={{ borderColor: severity.color, color: severity.color }}
            >
              <span className={styles.scoreNum}>{assessment.score}</span>
              <span className={styles.scoreMax}>Max: {maxScore}</span>
            </div>

            <div className={styles.scoreLabel} style={{ color: severity.color }}>
              {assessment.severityLabel}
            </div>

            <p className={styles.scoreDesc}>
              This rating is calculated using standardized clinical algorithms for {def?.name || assessment.type.toUpperCase()}.
            </p>

            {/* Severity segments bar */}
            <div className={styles.severityBar}>
              {def?.thresholds.map((th, i) => (
                <div 
                  key={i} 
                  className={styles.severitySeg} 
                  style={{ background: th.color, opacity: 0.8 }} 
                />
              ))}
            </div>

            {/* Severity Marker pointer */}
            <div className={styles.severityMarkerContainer}>
              <div 
                className={styles.severityMarker}
                style={{ left: `${percentage}%`, color: severity.color }}
              >
                <span>Score: {assessment.score}</span>
              </div>
            </div>
          </div>

          {/* Clinical Alerts Box */}
          {assessment.alerts && assessment.alerts.length > 0 && (
            <div className="alert alert-danger" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <FaExclamationTriangle style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontWeight: 700, margin: 0 }}>Clinical Safety Flag Triggered: CRITICAL ALERT</p>
                <ul style={{ margin: '4px 0 0', paddingLeft: '20px', fontSize: '13px' }}>
                  {assessment.alerts.map((alert, idx) => (
                    <li key={idx}>{alert.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Domain Breakdown (E.g. ADHD, Autism) */}
          {def?.domains && assessment.domainScores && (
            <div className={styles.domainsContainer}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
                Dimensional Domain Scores
              </h4>
              {Object.entries(assessment.domainScores).map(([name, data]: [string, any]) => {
                const domPercent = Math.round((data.score / data.max) * 100);
                return (
                  <div key={name} className={styles.domainRow}>
                    <div className={styles.domainHeader}>
                      <span className={styles.domainName}>{name}</span>
                      <span className={styles.domainScore}>
                        {data.score} / {data.max} ({domPercent}%)
                      </span>
                    </div>
                    <div className={styles.domainBar}>
                      <div 
                        className={styles.domainProgress}
                        style={{ width: `${domPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Clinician Documentation Notes */}
      <div className={`card ${styles.notesCard}`}>
        <div className="card-header">
          <span className="card-title">Clinician Session Documentation</span>
        </div>
        <div className="card-body">
          <div className="field">
            <label>Clinician Notes (optional)</label>
            <textarea
              id="assess-notes"
              placeholder="Record clinical impressions, recommendations, or therapeutic notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={handleSaveNotes}
              disabled={isSaving}
            >
              {isSaving ? <FaSpinner className="spinner" /> : 'Save Clinical Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
