'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { FaUser, FaFileMedical, FaExclamationTriangle, FaCapsules } from 'react-icons/fa';
import { Patient, Assessment, Prescription } from '../../types';
import styles from './DashboardView.module.css';

interface DashboardViewProps {
  patients: Patient[];
  assessments: Assessment[];
  prescriptions: Prescription[];
  setActivePatient: (patient: Patient | null) => void;
  setCurrentView: (view: any) => void;
  isTestEnv: boolean;
}

export default function DashboardView({
  patients,
  assessments,
  prescriptions,
  setActivePatient,
  setCurrentView,
  isTestEnv
}: DashboardViewProps) {

  // Filter out deleted items
  const activePatients = useMemo(() => patients.filter(p => !p.deleted), [patients]);
  const activeAssessments = useMemo(() => assessments.filter(a => !a.deleted), [assessments]);
  const activePrescriptions = useMemo(() => prescriptions.filter(p => !p.deleted), [prescriptions]);

  // High Risk Assessments list
  const highRiskAssessments = useMemo(() => {
    return activeAssessments.filter(a => {
      const isCritical = a.alerts && a.alerts.length > 0;
      return isCritical || a.severityLabel.toLowerCase().includes('severe') || a.severityLabel.toLowerCase().includes('critical');
    });
  }, [activeAssessments]);

  // Spring animations for Dashboard Stats
  const patientCountSpring = useSpring({ number: activePatients.length, from: { number: 0 }, immediate: isTestEnv });
  const assessmentCountSpring = useSpring({ number: activeAssessments.length, from: { number: 0 }, immediate: isTestEnv });
  const highRiskCountSpring = useSpring({ number: highRiskAssessments.length, from: { number: 0 }, immediate: isTestEnv });
  const prescriptionCountSpring = useSpring({ number: activePrescriptions.length, from: { number: 0 }, immediate: isTestEnv });

  const stats = [
    { title: 'Total Patients', spring: patientCountSpring, icon: <FaUser />, sub: 'Active local files', isDanger: false },
    { title: 'Completed Scales', spring: assessmentCountSpring, icon: <FaFileMedical />, sub: 'Standardized metrics', isDanger: false },
    { title: 'Suicidal / Critical Alert', spring: highRiskCountSpring, icon: <FaExclamationTriangle />, sub: 'Requires safety review', isDanger: true },
    { title: 'Prescriptions', spring: prescriptionCountSpring, icon: <FaCapsules />, sub: 'Issued locally', isDanger: false }
  ];

  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.title}>Overview</h1>
      
      {/* Stats Cards Grid */}
      <div className={`${styles.statsGrid} grid-4-equal`}>
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={isTestEnv ? { duration: 0 } : { delay: idx * 0.05 }}
            className={`${styles.statCard} card ${stat.isDanger ? styles.statCardDanger : ''}`}
          >
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>{stat.title}</span>
              <span className={`${styles.statIcon} ${stat.isDanger ? styles.statIconDanger : ''}`}>{stat.icon}</span>
            </div>
            <animated.h2 className={`${styles.statValue} ${stat.isDanger ? styles.statValueDanger : ''}`}>
              {stat.spring.number.to(n => Math.floor(n))}
            </animated.h2>
            <p className={styles.statSub}>{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className={styles.dashboardLayout}>
        {/* High Risk Alert Board */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
              <FaExclamationTriangle /> Critical Patient Safety Warnings
            </span>
          </div>
          <div className={`card-body ${styles.alertList}`}>
            {highRiskAssessments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>
                No active safety alerts. All patient risk markers are stable.
              </p>
            ) : (
              highRiskAssessments.map(assess => {
                const p = patients.find(p => p.id === assess.patientId);
                return (
                  <div 
                    key={assess.id} 
                    className="alert alert-danger" 
                    onClick={() => {
                      if (p) {
                        setActivePatient(p);
                        setCurrentView('patient-profile');
                      }
                    }}
                    style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
                  >
                    <FaExclamationTriangle style={{ fontSize: '18px', marginRight: '10px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, margin: 0 }}>{p ? p.name : 'Unknown Patient'} ({assess.severityLabel})</p>
                      <p style={{ fontSize: '12px', marginTop: '2px', margin: 0 }}>
                        {assess.alerts && assess.alerts[0] ? assess.alerts[0].message : `${assess.type.toUpperCase()} alert score reached.`}
                      </p>
                      <p style={{ fontSize: '10px', color: 'rgba(230,57,70,0.7)', marginTop: '4px', margin: 0 }}>
                        Registered on: {new Date(assess.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Patients Activity */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Patients</span>
          </div>
          <div className={styles.recentPatientsList}>
            {activePatients.slice(0, 5).map(p => (
              <div 
                key={p.id} 
                className={styles.patientRow} 
                onClick={() => {
                  setActivePatient(p);
                  setCurrentView('patient-profile');
                }}
              >
                <div className={styles.avatar}>
                  {p.name.charAt(0)}
                </div>
                <div className={styles.patientDetails}>
                  <p className={styles.patientName}>{p.name}</p>
                  <p className={styles.patientMeta}>ID: {p.patientId || 'N/A'} | {p.gender} | {p.age} yrs</p>
                </div>
              </div>
            ))}
            {activePatients.length === 0 && (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                No patients registered yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
