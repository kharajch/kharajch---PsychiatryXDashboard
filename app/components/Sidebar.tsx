'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaUser, FaCog, FaHistory, FaCapsules, 
  FaHeartbeat, FaFileMedical, FaSignOutAlt 
} from 'react-icons/fa';
import { Patient, Assessment } from '../types';
import { ASSESSMENTS } from '../lib/assessments-data';
import styles from './Sidebar.module.css';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: any) => void;
  activePatient: Patient | null;
  setActivePatient: (patient: Patient | null) => void;
  patients: Patient[];
  assessments: Assessment[];
  patientGrowthData: { dayLabel: string; count: number }[];
  assessmentDistribution: { type: string; label: string; count: number; percentage: number; color: string }[];
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  logout: () => void;
  isTestEnv: boolean;
  fullName: string;
  onStartAssessment: (scaleKey: string) => void;
}

export default function Sidebar({
  currentView,
  setCurrentView,
  activePatient,
  setActivePatient,
  patients,
  assessments,
  patientGrowthData,
  assessmentDistribution,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  logout,
  isTestEnv,
  fullName,
  onStartAssessment
}: SidebarProps) {
  
  const navItems = [
    { view: 'dashboard', label: 'Overview', icon: <FaHeartbeat /> },
    { view: 'patients', label: 'Patient Database', icon: <FaUser /> },
    { view: 'assessments', label: 'Run Assessment', icon: <FaFileMedical /> },
    { view: 'patient-profile', label: 'Patient Profile', icon: <FaUser /> },
    { view: 'prescriptions', label: 'Prescriptions', icon: <FaCapsules /> },
    { view: 'reports', label: 'Reports', icon: <FaHistory /> },
    { view: 'settings', label: 'Settings', icon: <FaCog /> }
  ];

  const activePatientsCount = patients.filter(p => !p.deleted).length;
  const activeAssessmentsCount = assessments.filter(a => !a.deleted).length;

  return (
    <div id="sidebar" className={`${styles.sidebar} sidebar ${isMobileMenuOpen ? `${styles.sidebarOpen} open` : ''}`}>
      <div className={`${styles.sidebarScan} sidebar-scan`}></div>
      
      {/* Logo Section */}
      <div className={`${styles.sidebarLogo} sidebar-logo`}>
        <div className={`${styles.sidebarBrandCorner} sidebar-brand-corner ${styles.sidebarBrandCornerTl} sidebar-brand-corner--tl`}></div>
        <div className={`${styles.sidebarBrandCorner} sidebar-brand-corner ${styles.sidebarBrandCornerBr} sidebar-brand-corner--br`}></div>
        <h1 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.3px', margin: 0 }}>
          PsychiatryX Clinic
        </h1>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
          Psychiatric Management System
        </p>
        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span className={`${styles.sidebarPulseDot} sidebar-pulse-dot`} style={{ background: 'var(--primary)' }}></span>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
            v1.0 · Online
          </span>
        </div>
      </div>

      <div className={`${styles.sidebarGlowLine} sidebar-glow-line`}></div>

      {/* Active Patient Indicator */}
      {activePatient && (
        <div className={`${styles.sidebarPatient} sidebar-patient`}>
          <div className="label">Active Patient</div>
          <div className="name">{activePatient.name}</div>
          <div className="sub">
            Age: {activePatient.age} | {activePatient.gender}
          </div>
        </div>
      )}

      {/* Main Navigation Section */}
      <div className={`${styles.sidebarDivider} sidebar-divider`}>
        <span className={`${styles.sidebarDividerLabel} sidebar-divider-label`}>Main Navigation</span>
      </div>
      
      <div className={`${styles.sidebarSection} sidebar-section`}>
        {navItems.map((item, idx) => {
          const isActive = currentView === item.view;
          return (
            <React.Fragment key={item.view}>
              <motion.div
                id={item.view === 'assessments' ? 'nav-assess' : undefined}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={isTestEnv ? { duration: 0 } : { delay: 0.05 + idx * 0.03, type: 'spring', damping: 20, stiffness: 150 }}
                whileHover={!isActive && !isTestEnv ? { x: 6, transition: { duration: 0.2 } } : {}}
                whileTap={!isTestEnv ? { scale: 0.97 } : undefined}
                onClick={() => {
                  setCurrentView(item.view);
                  setIsMobileMenuOpen(false);
                }}
                className={`${styles.navItem} nav-item ${isActive ? `${styles.navItemActive} active` : 'nav-item-hover'}`}
              >
                {isActive && <div className={`${styles.navActiveIndicator} nav-active-indicator`} />}
                <span style={{ fontSize: '14px', opacity: isActive ? 1 : 0.6, transition: 'opacity 0.2s', display: 'inline-flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </motion.div>
              {item.view === 'assessments' && (
                <div className={styles.navSub} id="assess-sub">
                  <div className={`${styles.navItem} nav-item nav-item-hover`} onClick={(e) => { e.stopPropagation(); onStartAssessment('anxiety'); }}>
                    <span style={{ fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}>😰</span>
                    <span>Anxiety (CAA-14)</span>
                  </div>
                  <div className={`${styles.navItem} nav-item nav-item-hover`} onClick={(e) => { e.stopPropagation(); onStartAssessment('depression'); }}>
                    <span style={{ fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}>😔</span>
                    <span>Depression (CDA-17)</span>
                  </div>
                  <div className={`${styles.navItem} nav-item nav-item-hover`} onClick={(e) => { e.stopPropagation(); onStartAssessment('mania'); }}>
                    <span style={{ fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}>⚡</span>
                    <span>Mania (MSS-11)</span>
                  </div>
                  <div className={`${styles.navItem} nav-item nav-item-hover`} onClick={(e) => { e.stopPropagation(); onStartAssessment('suicide'); }}>
                    <span style={{ fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}>⚠️</span>
                    <span>Suicide Risk</span>
                  </div>
                  <div className={`${styles.navItem} nav-item nav-item-hover`} onClick={(e) => { e.stopPropagation(); onStartAssessment('ocd'); }}>
                    <span style={{ fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}>🔄</span>
                    <span>OCD</span>
                  </div>
                  <div className={`${styles.navItem} nav-item nav-item-hover`} onClick={(e) => { e.stopPropagation(); onStartAssessment('psychosis'); }}>
                    <span style={{ fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}>🌀</span>
                    <span>Psychosis</span>
                  </div>
                  <div className={`${styles.navItem} nav-item nav-item-hover`} onClick={(e) => { e.stopPropagation(); onStartAssessment('adhd'); }}>
                    <span style={{ fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}>🎯</span>
                    <span>ADHD</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Session/Logout Section */}
      <div className={`${styles.sidebarDivider} sidebar-divider`}>
        <span className={`${styles.sidebarDividerLabel} sidebar-divider-label`}>Session</span>
      </div>
      <div className={`${styles.sidebarSection} sidebar-section`}>
        <div 
          className={`${styles.navItem} nav-item nav-item-hover`} 
          onClick={logout}
          style={{ color: 'var(--primary)' }}
        >
          <span style={{ fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}><FaSignOutAlt /></span>
          <span>Logout</span>
        </div>
      </div>

      {/* Analytics Brief Section */}
      <div className={`${styles.sidebarAnalytics} sidebar-analytics`}>
        <div className="sidebar-analytics-title">
          <span>Analytics Brief</span>
          <svg width="45" height="12" viewBox="0 0 45 12" style={{ opacity: 0.7 }}>
            <path 
              className="clinical-pulse-wave"
              d="M0 6 H15 L18 2 L22 10 L25 6 H45" 
              fill="none" 
              stroke="var(--primary)" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>
        </div>

        {/* Patient Growth Sparkline */}
        <div className="sidebar-analytics-chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)' }}>Patient Growth (7d)</span>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'white' }}>
              {activePatientsCount} Total
            </span>
          </div>
          <div style={{ height: '60px', position: 'relative' }}>
            {(() => {
              if (patientGrowthData.length === 0) return null;
              const counts = patientGrowthData.map(d => d.count);
              const minVal = Math.min(...counts);
              const maxVal = Math.max(...counts);
              const diff = maxVal - minVal;
              const svgW = 200;
              const svgH = 60;
              
              const sparkPoints = patientGrowthData.map((pt, idx) => {
                const x = 10 + (idx * ((svgW - 20) / 6));
                const y = diff === 0 
                  ? svgH / 2 
                  : svgH - 10 - ((pt.count - minVal) / Math.max(diff, 1)) * (svgH - 20);
                return { x, y, ...pt };
              });

              const pathD = sparkPoints.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
              const areaD = sparkPoints.length > 0 
                ? `${pathD} L ${sparkPoints[sparkPoints.length - 1].x} ${svgH} L ${sparkPoints[0].x} ${svgH} Z`
                : '';

              return (
                <svg width="100%" height="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="sidebarSparkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {areaD && <path d={areaD} fill="url(#sidebarSparkGradient)" />}
                  {pathD && (
                    <path 
                      d={pathD} 
                      fill="none" 
                      stroke="var(--primary)" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  )}
                  {sparkPoints.map((pt, idx) => (
                    <circle 
                      key={idx} 
                      cx={pt.x} 
                      cy={pt.y} 
                      r="2.5" 
                      fill="#0d0d0d" 
                      stroke="var(--primary)" 
                      strokeWidth="1.5" 
                    />
                  ))}
                </svg>
              );
            })()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px', padding: '0 4px' }}>
            <span>{patientGrowthData[0]?.dayLabel}</span>
            <span>{patientGrowthData[3]?.dayLabel}</span>
            <span>{patientGrowthData[6]?.dayLabel}</span>
          </div>
        </div>

        {/* Assessment Share Doughnut */}
        <div className="sidebar-analytics-chart-container">
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Assessment Share
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="50" height="50" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
              {assessmentDistribution[0]?.label !== 'None' ? (
                assessmentDistribution.map((slice, idx) => {
                  const prevSum = assessmentDistribution.slice(0, idx).reduce((sum, item) => sum + item.percentage, 0);
                  const dashOffset = 100 - prevSum + 25;
                  return (
                    <circle
                      key={idx}
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="4.5"
                      strokeDasharray={`${slice.percentage} ${100 - slice.percentage}`}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  );
                })
              ) : (
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--text-muted)" strokeWidth="4.5" strokeDasharray="100 0" strokeDashoffset="25" />
              )}
            </svg>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
              {assessmentDistribution[0]?.label !== 'None' ? (
                assessmentDistribution.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9px', gap: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                      {item.label}
                    </span>
                    <span style={{ fontWeight: 700, color: 'white', flexShrink: 0 }}>{item.percentage}%</span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No assessments logged yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div style={{ padding: '0 12px 10px' }}>
        <div className={`${styles.sidebarQuickStat} sidebar-quick-stat`} style={{ marginBottom: '10px' }}>
          <div className={`${styles.sidebarQuickStatIcon} sidebar-quick-stat-icon`} style={{ background: 'rgba(230,57,70,0.12)', color: 'var(--primary)' }}>👥</div>
          <div>
            <div className={`${styles.sidebarQuickStatValue} sidebar-quick-stat-value`}>{activePatientsCount}</div>
            <div className={`${styles.sidebarQuickStatLabel} sidebar-quick-stat-label`}>Patients</div>
          </div>
        </div>
        <div className={`${styles.sidebarQuickStat} sidebar-quick-stat`}>
          <div className={`${styles.sidebarQuickStatIcon} sidebar-quick-stat-icon`} style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>📋</div>
          <div>
            <div className={`${styles.sidebarQuickStatValue} sidebar-quick-stat-value`}>{activeAssessmentsCount}</div>
            <div className={`${styles.sidebarQuickStatLabel} sidebar-quick-stat-label`}>Assessments</div>
          </div>
        </div>
      </div>

      {/* Clinician Profile Footer */}
      <div className={styles.sidebarProfile}>
        <div className={styles.profileAvatar}>
          {fullName ? fullName.charAt(0).toUpperCase() : 'C'}
        </div>
        <div className={styles.profileDetails}>
          <span className={styles.profileName}>
            Dr. {fullName || 'Clinician'}
          </span>
          <span className={styles.profileStatus}>
            <span className={styles.statusDot} /> Verified Provider
          </span>
        </div>
      </div>

      {/* Footer Branding Info */}
      <div className={styles.sidebarFooter}>
        PsychiatryX Clinic v1.0<br />Local · Offline · Secure
      </div>
    </div>
  );
}
