'use client';

import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaCheck } from 'react-icons/fa';
import { Patient } from '../../types';
import { ASSESSMENTS } from '../../lib/assessments-data';
import styles from './AssessmentTaking.module.css';

interface AssessmentTakingProps {
  activeScale: string;
  activePatient: Patient;
  onFinish: (answers: number[], notes: string, duration: number) => void;
  onCancel: () => void;
  isTestEnv: boolean;
}

export default function AssessmentTaking({
  activeScale,
  activePatient,
  onFinish,
  onCancel,
  isTestEnv
}: AssessmentTakingProps) {
  const def = ASSESSMENTS[activeScale];
  const totalQuestions = def.questions.length;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => Array(totalQuestions).fill(-1));
  const [notes, setNotes] = useState('');
  const [startTime] = useState(() => Date.now());

  const currentQuestion = def.questions[currentIdx];
  const percentComplete = Math.round((answers.filter(a => a !== -1).length / totalQuestions) * 100);

  // Keyboard Navigation Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      // Select option with 0-9 keys
      if (/^[0-9]$/.test(key)) {
        const score = parseInt(key);
        if (score < def.options.length) {
          handleSelectOption(score);
        }
      } 
      // Navigation keys
      else if (key === 'ArrowLeft' || key === 'Backspace') {
        e.preventDefault();
        handlePrev();
      } else if (key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, answers]);

  const handleSelectOption = (score: number) => {
    const updated = [...answers];
    updated[currentIdx] = score;
    setAnswers(updated);

    // Auto advance after 220ms for smooth clinical workflow, unless it's the last question or we are in a test environment
    if (!isTestEnv && currentIdx < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentIdx(prev => prev + 1);
      }, 220);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handleFinish = () => {
    const unansweredCount = answers.filter(a => a === -1).length;
    if (unansweredCount > 0) {
      if (!confirm(`Warning: There are ${unansweredCount} unanswered questions. Are you sure you want to finish and calculate scores?`)) {
        return;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    onFinish(answers, notes, duration);
  };

  return (
    <div className={styles.container}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Running {def.short} for {activePatient.name}</span>
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        </div>

        <div className="card-body">
          {/* Progress Bar */}
          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar} style={{ width: `${percentComplete}%` }} />
          </div>

          {/* Question Details */}
          {currentQuestion.domain && (
            <div className={styles.domainLabel}>{currentQuestion.domain}</div>
          )}
          
          <div className={styles.questionNumber}>
            Question {currentIdx + 1} of {totalQuestions}
          </div>

          <h3 className={styles.questionText}>
            {currentQuestion.text}
          </h3>
          
          <p className={styles.questionDesc}>
            {currentQuestion.desc || 'Evaluate severity according to standard clinical descriptors.'}
          </p>

          {/* Options List */}
          <div className={styles.optionsList}>
            {def.options.map((opt) => {
              const isSelected = answers[currentIdx] === opt.score;
              return (
                <div
                  key={opt.score}
                  onClick={() => handleSelectOption(opt.score)}
                  className={`${styles.optionCard} q-option ${isSelected ? `${styles.optionCardSelected} selected` : ''}`}
                >
                  <span className={styles.scoreBadge}>{opt.score}</span>
                  <span className={styles.optionLabel}>{opt.label}</span>
                </div>
              );
            })}
          </div>

          {/* Clinician Session Notes */}
          <div className="field" style={{ marginTop: '24px' }}>
            <label>Clinician Session Notes (Optional)</label>
            <textarea
              placeholder="Record any qualitative behavioral observations or therapeutic context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Navigation Controls */}
          <div className={styles.navSection}>
            <button
              className="btn btn-secondary"
              onClick={handlePrev}
              disabled={currentIdx === 0}
            >
              <FaChevronLeft /> Back
            </button>

            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Completed: {percentComplete}%
            </span>

            {currentIdx < totalQuestions - 1 ? (
              <button
                className="btn btn-secondary"
                onClick={handleNext}
                disabled={answers[currentIdx] === -1}
              >
                Next →
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleFinish}
                style={{ backgroundColor: 'var(--success)' }}
              >
                Finish ✓
              </button>
            )}
          </div>

          {/* Question Jump Grid */}
          <div className={styles.navGrid}>
            {answers.map((ans, idx) => {
              const isCurrent = currentIdx === idx;
              const isAnswered = ans !== -1;
              
              let gridClass = styles.navGridItem;
              if (isCurrent && isAnswered) gridClass = `${styles.navGridItem} ${styles.navGridItemAnsweredActive}`;
              else if (isCurrent) gridClass = `${styles.navGridItem} ${styles.navGridItemActive}`;
              else if (isAnswered) gridClass = `${styles.navGridItem} ${styles.navGridItemAnswered}`;

              return (
                <div
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={gridClass}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
