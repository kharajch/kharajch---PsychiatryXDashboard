'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import { Patient, Assessment } from '../../types';
import { ASSESSMENTS, getSeverity } from '../../lib/assessments-data';
import styles from './RunAssessment.module.css';

interface RunAssessmentProps {
  activePatient: Patient | null;
  assessments: Assessment[];
  onStartAssessment: (scaleKey: any) => void;
  isTestEnv: boolean;
}

export default function RunAssessment({
  activePatient,
  assessments,
  onStartAssessment,
  isTestEnv
}: RunAssessmentProps) {
  
  // Find the latest completed assessment score for each type for this patient
  const latestScores = useMemo(() => {
    if (!activePatient) return {};
    const patientAssessments = assessments.filter(a => a.patientId === activePatient.id && !a.deleted);
    const scoreMap: Record<string, { score: number; maxScore: number; severityLabel: string; color: string }> = {};
    
    patientAssessments.forEach(a => {
      // Keep only the most recent assessment for each type
      const existing = scoreMap[a.type];
      if (!existing || new Date(a.date).getTime() > new Date((a as any).date).getTime()) {
        const severity = getSeverity(a.type, a.score);
        scoreMap[a.type] = {
          score: a.score,
          maxScore: a.maxScore,
          severityLabel: a.severityLabel,
          color: severity.color
        };
      }
    });
    return scoreMap;
  }, [assessments, activePatient]);

  return (
    <div className={styles.assessmentContainer}>
      <h1 className={styles.title}>Run Assessment</h1>
      <p className={styles.subtitle}>
        Select a standardized psychiatric rating scale to evaluate {activePatient?.name || 'patient'}.
      </p>

      <div className={styles.assessmentGrid}>
        {Object.entries(ASSESSMENTS).map(([key, def], idx) => {
          const completedInfo = latestScores[key];
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={isTestEnv ? { duration: 0 } : { delay: idx * 0.04 }}
              onClick={() => onStartAssessment(key)}
              className={`${styles.assessmentCard} assessment-card ${completedInfo ? styles.assessmentCardCompleted : ''}`}
            >
              <div className={styles.cardHeader}>
                <span className={styles.icon}>{def.icon}</span>
                {completedInfo && (
                  <span className={styles.checkCircle} title="Completed in past sessions">
                    <FaCheckCircle />
                  </span>
                )}
              </div>

              <div className={styles.infoSection}>
                <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {def.short}
                </span>
                <h3 className={styles.name}>{def.name}</h3>
                <p className={styles.itemsCount}>
                  {def.questions.length} items · {def.timeframe}
                </p>
              </div>

              {completedInfo && (
                <div 
                  className={styles.scoreBadge}
                  style={{ 
                    background: `rgba(${completedInfo.color === '#059669' ? '5,150,105' : completedInfo.color === '#e63946' ? '230,57,70' : '217,119,6'}, 0.1)`,
                    color: completedInfo.color,
                    border: `1px solid ${completedInfo.color}`
                  }}
                >
                  Latest: {completedInfo.score}/{completedInfo.maxScore} ({completedInfo.severityLabel})
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
