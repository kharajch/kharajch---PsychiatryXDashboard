'use client';

import React from 'react';
import { FaBars, FaUserPlus, FaSignOutAlt } from 'react-icons/fa';
import { Patient } from '../../types';
import { ASSESSMENTS } from '../../lib/assessments-data';
import styles from './Header.module.css';

interface HeaderProps {
  currentView: string;
  activeScale: string | null;
  activePatient: Patient | null;
  setActivePatient: (patient: Patient | null) => void;
  syncStatus: 'offline' | 'syncing' | 'online' | 'error';
  syncMessage: string;
  isMobile: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onNewPatientClick: () => void;
  logout: () => void;
}

export default function Header({
  currentView,
  activeScale,
  activePatient,
  setActivePatient,
  syncStatus,
  syncMessage,
  isMobile,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onNewPatientClick,
  logout
}: HeaderProps) {
  
  const getTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard';
      case 'patients': return 'Patient Database';
      case 'assessments': return activeScale ? ASSESSMENTS[activeScale].name : 'Assessments';
      case 'assessment-taking': return activeScale ? `Running ${ASSESSMENTS[activeScale].short}` : 'Run Assessment';
      case 'assessment-result': return 'Assessment Results';
      case 'patient-profile': return 'Patient Profile';
      case 'prescriptions': return 'Prescriptions';
      case 'reports': return 'Reports';
      case 'settings': return 'Settings';
      default: return 'PsychiatryX';
    }
  };

  const getSub = () => {
    switch (currentView) {
      case 'dashboard': return 'Overview & Analytics';
      case 'patients': return 'Search and manage all patients';
      case 'assessments': return 'Select and run a clinical assessment';
      case 'assessment-taking': return activeScale ? `Assessment progress for ${activePatient?.name || 'patient'}` : 'Answer questions';
      case 'assessment-result': return 'Review scores and clinical thresholds';
      case 'patient-profile': return 'Assessment history and details';
      case 'prescriptions': return 'OPD prescription records';
      case 'reports': return 'Generate clinical PDF reports';
      case 'settings': return 'Clinic configuration';
      default: return 'Psychiatric Management Platform';
    }
  };

  const getSyncDotClass = () => {
    switch (syncStatus) {
      case 'syncing': return styles.syncSyncing;
      case 'online': return styles.syncOnline;
      case 'error': return styles.syncError;
      case 'offline':
      default: return styles.syncOffline;
    }
  };

  return (
    <header className={styles.header}>
      {isMobile && (
        <button 
          className="btn btn-secondary btn-icon mobile-toggle"
          id="sidebar-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{ marginRight: '8px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center' }}
        >
          <FaBars className="fa-bars" />
        </button>
      )}

      <div style={{ flex: 1 }}>
        <h2 id="header-title" style={{ fontSize: '16px', color: 'white', margin: 0 }}>
          {getTitle()}
        </h2>
        {!isMobile && (
          <p id="header-sub" style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
            {getSub()}
          </p>
        )}
      </div>

      {/* Selected Patient Context Banner */}
      {activePatient && (
        <div 
          id="header-patient" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            background: 'rgba(230,57,70,0.08)', 
            border: '1px solid var(--border)', 
            padding: '6px 12px', 
            borderRadius: 'var(--radius)' 
          }}
        >
          <div id="hp-name" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
            {activePatient.name}
          </div>
          <button 
            className="btn btn-sm btn-secondary" 
            onClick={() => setActivePatient(null)}
            style={{ padding: '2px 6px', fontSize: '11px' }}
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Sync Status Badge */}
      <div className={styles.syncIndicator} id="sync-indicator">
        <span className={`${styles.syncDot} ${getSyncDotClass()}`} />
        {!isMobile && <span id="sync-text" style={{ fontSize: '11px' }}>{syncMessage}</span>}
      </div>

      {/* Action Buttons */}
      <button className="btn btn-primary btn-sm" onClick={onNewPatientClick}>
        <FaUserPlus /> {!isMobile && 'New Patient'}
      </button>

      <button className="btn btn-secondary btn-sm" id="header-logout-btn" onClick={logout} title="Logout" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <FaSignOutAlt />
        {!isMobile && <span>Logout</span>}
      </button>
    </header>
  );
}
