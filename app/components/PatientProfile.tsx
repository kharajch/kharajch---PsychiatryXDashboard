'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEdit, FaFilePdf, FaEye, FaTimes, FaSpinner, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import { Patient, Assessment, Prescription } from '../../types';
import { ASSESSMENTS, getSeverity } from '../../lib/assessments-data';
import { generateAssessmentPDF, generateFullReportPDF } from '../../lib/pdf-utils';
import styles from './PatientProfile.module.css';

interface PatientProfileProps {
  activePatient: Patient;
  assessments: Assessment[];
  prescriptions: Prescription[];
  onOpenEditModal: (p: Patient) => void;
  onDeleteAssessment: (id: string) => Promise<void>;
  setCurrentView: (view: any) => void;
  onStartAssessment: (scaleKey: any) => void;
  onNewRxClick: () => void;
  isTestEnv: boolean;
}

export default function PatientProfile({
  activePatient,
  assessments,
  prescriptions,
  onOpenEditModal,
  onDeleteAssessment,
  setCurrentView,
  onStartAssessment,
  onNewRxClick,
  isTestEnv
}: PatientProfileProps) {
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  // Get active assessments for this patient
  const patientAssessments = useMemo(() => {
    return assessments.filter(a => a.patientId === activePatient.id && !a.deleted);
  }, [assessments, activePatient]);

  // Get prescriptions for this patient
  const patientPrescriptions = useMemo(() => {
    return prescriptions.filter(p => p.patientId === activePatient.id && !p.deleted);
  }, [prescriptions, activePatient.id]);

  const patientAlerts = useMemo(() => {
    const alertsList: string[] = [];
    patientAssessments.forEach(a => {
      if (a.alerts && a.alerts.length > 0) {
        a.alerts.forEach(alert => {
          const scaleName = a.type === 'suicide' ? 'SRA-20' : (a.type === 'depression' ? 'CDA-17' : a.type.toUpperCase());
          alertsList.push(`${scaleName}: ${alert.message}`);
        });
      }
    });
    return alertsList;
  }, [patientAssessments]);

  // Compute trend points for SVG chart
  const chartPoints = useMemo(() => {
    if (patientAssessments.length === 0) return [];
    
    // Sort assessments by date ascending
    const sorted = [...patientAssessments].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Map to coordinate structures
    return sorted.map((a) => {
      const scale = ASSESSMENTS[a.type];
      const maxScore = scale ? scale.maxScore : 100;
      const percentage = (a.score / maxScore) * 100;
      return {
        label: scale ? scale.short : a.type.toUpperCase(),
        score: a.score,
        percentage,
        date: new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    });
  }, [patientAssessments]);

  const handleDownloadFullReport = () => {
    generateFullReportPDF(activePatient, patientAssessments);
  };

  const handleDownloadAssessmentPDF = (assess: Assessment) => {
    generateAssessmentPDF(assess, activePatient);
  };

  const handleDeleteAssessment = async (id: string) => {
    if (confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      await onDeleteAssessment(id);
    }
  };

  return (
    <div className={styles.profileContainer}>
      {/* Patient Header Block */}
      <div className={`${styles.profileHeaderCard} profile-header`}>
        <div className={styles.profileHeaderLayout}>
          <div className={styles.patientMetaBlock}>
            <div className={styles.avatar}>{activePatient.name.charAt(0)}</div>
            <div>
              <h2 className={styles.patientName}>{activePatient.name}</h2>
              <p className={styles.patientSub}>
                ID: <span className="tag">{activePatient.patientId || 'N/A'}</span> | Registered: {new Date(activePatient.registeredOn).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('patients')}>
              ← All Patients
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => onStartAssessment('depression')}>
              📋 New Assessment
            </button>
            <button className="btn btn-primary btn-sm" onClick={onNewRxClick}>
              💊 New Rx
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => onOpenEditModal(activePatient)}>
              <FaEdit /> Edit Details
            </button>
            <button className="btn btn-success btn-sm" onClick={handleDownloadFullReport}>
              📄 Full Report
            </button>
          </div>
        </div>

        {/* Demographic detail grid */}
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Age</span>
            <span className={styles.detailValue}>{activePatient.age}y</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Gender</span>
            <span className={styles.detailValue}>{activePatient.gender}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Date of Birth</span>
            <span className={styles.detailValue}>{activePatient.dob || '—'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Phone Number</span>
            <span className={styles.detailValue}>{activePatient.phone || '—'}</span>
          </div>
          <div className={styles.detailItem} style={{ marginTop: '12px' }}>
            <span className={styles.detailLabel}>Email Address</span>
            <span className={styles.detailValue}>{activePatient.email || '—'}</span>
          </div>
          <div className={styles.detailItem} style={{ marginTop: '12px' }}>
            <span className={styles.detailLabel}>Referral Source</span>
            <span className={styles.detailValue}>{activePatient.referral || '—'}</span>
          </div>
        </div>
      </div>

      {patientAlerts.length > 0 && (
        <div className="alert alert-danger" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <FaExclamationTriangle /> CRITICAL CLINICAL ALERTS / WARNINGS
          </div>
          <ul style={{ margin: '4px 0 0', paddingLeft: '20px', fontSize: '13px' }}>
            {patientAlerts.map((alert, idx) => (
              <li key={idx}>{alert}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid-2-equal" style={{ marginBottom: '24px' }}>
        {/* Presenting Complaint & History */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Clinical Background</span>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '16px' }}>
              <span className={styles.detailLabel}>Presenting Complaint</span>
              <p style={{ color: 'white', marginTop: '4px', fontSize: '13px' }}>
                {activePatient.complaint || 'No complaint listed.'}
              </p>
            </div>
            <div>
              <span className={styles.detailLabel}>Psychiatric & Medical History</span>
              <p style={{ color: 'white', marginTop: '4px', fontSize: '13px' }}>
                {activePatient.history || 'No psychiatric history recorded.'}
              </p>
            </div>
          </div>
        </div>

        {/* Current Meds & Allergies */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Medication & Warnings</span>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: '16px' }}>
              <span className={styles.detailLabel}>Current Medications</span>
              <p style={{ color: 'white', marginTop: '4px', fontSize: '13px' }}>
                {activePatient.medications || 'No current medications logged.'}
              </p>
            </div>
            <div>
              <span className={styles.detailLabel}>Allergies & Contraindications</span>
              <p style={{ color: 'var(--primary)', marginTop: '4px', fontSize: '13px', fontWeight: 600 }}>
                {activePatient.allergies || 'No allergies reported.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Diagnostic Line Chart Card */}
      <div className={`card ${styles.trendCard}`}>
        <div className="card-header">
          <span className="card-title">Longitudinal Score Trend</span>
        </div>
        <div className="card-body">
          {chartPoints.length < 2 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
              Requires at least 2 completed assessments to visualize trend.
            </p>
          ) : (
            <div className={styles.chartContainer}>
              {(() => {
                const svgW = 400;
                const svgH = 150;
                
                const points = chartPoints.map((pt, idx) => {
                  const x = 30 + (idx * ((svgW - 50) / (chartPoints.length - 1)));
                  const y = svgH - 25 - (pt.percentage / 100) * (svgH - 50);
                  return { x, y, ...pt };
                });

                const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                
                return (
                  <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>
                    {/* Grid Lines */}
                    <line x1="30" y1="25" x2={svgW} y2="25" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                    <line x1="30" y1="75" x2={svgW} y2="75" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                    <line x1="30" y1="125" x2={svgW} y2="125" stroke="rgba(255,255,255,0.08)" />

                    {/* Y Axis Labels */}
                    <text x="5" y="28" fill="var(--text-muted)" fontSize="8">100%</text>
                    <text x="5" y="78" fill="var(--text-muted)" fontSize="8">50%</text>
                    <text x="5" y="128" fill="var(--text-muted)" fontSize="8">0%</text>

                    {/* Trend Line */}
                    <path 
                      d={pathD} 
                      fill="none" 
                      stroke="var(--primary)" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />

                    {/* Dots & Labels */}
                    {points.map((pt, idx) => (
                      <g key={idx}>
                        <circle 
                          cx={pt.x} 
                          cy={pt.y} 
                          r="4" 
                          fill="#121212" 
                          stroke="var(--primary)" 
                          strokeWidth="2" 
                        />
                        <text 
                          x={pt.x} 
                          y={pt.y - 10} 
                          fill="white" 
                          fontSize="9" 
                          fontWeight="700" 
                          textAnchor="middle"
                        >
                          {pt.score}
                        </text>
                        <text 
                          x={pt.x} 
                          y={svgH - 8} 
                          fill="var(--text-muted)" 
                          fontSize="8" 
                          textAnchor="middle"
                        >
                          {pt.label} ({pt.date})
                        </text>
                      </g>
                    ))}
                  </svg>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Assessment History Table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Completed Scales History</span>
          <button className="btn btn-primary btn-sm" onClick={() => onStartAssessment('depression')}>
            <FaPlus /> Run Assessment
          </button>
        </div>
        <div className="table-responsive">
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Assessment Type</th>
                <th>Score</th>
                <th>Severity</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patientAssessments.map((a) => {
                const scale = ASSESSMENTS[a.type];
                return (
                  <tr key={a.id}>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td>{scale ? scale.name : a.type.toUpperCase()} ({scale ? scale.short : a.type})</td>
                    <td>{a.score} / {a.maxScore}</td>
                    <td>
                      <span 
                        className={`badge ${scale?.thresholds.find(t => t.label === a.severityLabel)?.badge || 'badge-minimal'}`}
                        style={{ border: '1px solid currentColor' }}
                      >
                        {a.severityLabel}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setSelectedAssessment(a)}
                        >
                          <FaEye /> View
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleDownloadAssessmentPDF(a)}
                        >
                          <FaFilePdf /> Report
                        </button>
                        {/* E2E Trash Emoji Rule: Button must contain literal "🗑" */}
                        <button
                          className="btn btn-sm btn-danger btn-icon"
                          onClick={() => handleDeleteAssessment(a.id)}
                          title="Delete Assessment"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {patientAssessments.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No completed scales found for this patient.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assessment Question responses view modal */}
      <AnimatePresence>
        {selectedAssessment && (
          <div className={styles.modalOverlay}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={isTestEnv ? { duration: 0 } : { duration: 0.2 }}
              className={styles.modal}
            >
              <div className={styles.modalHeader}>
                <h3 className="card-title">
                  {ASSESSMENTS[selectedAssessment.type]?.name || selectedAssessment.type.toUpperCase()} Log
                </h3>
                <button 
                  onClick={() => setSelectedAssessment(null)}
                  className="modal-close"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <FaTimes />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>SCORE / SEVERITY</p>
                    <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                      {selectedAssessment.score} / {selectedAssessment.maxScore} ({selectedAssessment.severityLabel})
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>COMPLETED ON</p>
                    <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 600, color: 'white' }}>
                      {new Date(selectedAssessment.date).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ASSESSMENTS[selectedAssessment.type]?.questions.map((q, qidx) => {
                    const ans = selectedAssessment.answers[qidx];
                    const opt = ASSESSMENTS[selectedAssessment.type]?.options.find(o => o.score === ans);
                    return (
                      <div key={qidx} className={styles.itemRow}>
                        <div className={styles.itemQuestion}>{qidx + 1}. {q.text}</div>
                        <div className={styles.itemAnswer}>
                          Answer: {ans} - {opt ? opt.label : 'N/A'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
