'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Patient, Assessment, Prescription } from '../types';
import { getRxDB, factoryReset, setupClientReplication } from '../lib/rxdb-client';
import { ASSESSMENTS, getSeverity, computeDomainScores } from '../lib/assessments-data';

// Component Imports
import BackgroundLattice from './components/BackgroundLattice';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AuthOverlay from './components/AuthOverlay';
import DashboardView from './components/DashboardView';
import PatientDatabase from './components/PatientDatabase';
import RunAssessment from './components/RunAssessment';
import AssessmentTaking from './components/AssessmentTaking';
import AssessmentResult from './components/AssessmentResult';
import PatientProfile from './components/PatientProfile';
import PrescriptionBuilder from './components/PrescriptionBuilder';
import ReportsGenerator from './components/ReportsGenerator';
import SettingsPanel from './components/SettingsPanel';
import Toast from './components/Toast';

type View = 
  | 'dashboard' 
  | 'patients' 
  | 'assessments' 
  | 'assessment-taking' 
  | 'assessment-result' 
  | 'patient-profile' 
  | 'prescriptions' 
  | 'reports' 
  | 'settings';

export default function Home() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');

  // Routing and UI States
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'offline' | 'syncing' | 'online' | 'error'>('offline');
  const [syncMessage, setSyncMessage] = useState<string>('Local only');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTestEnv, setIsTestEnv] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!(navigator.webdriver || window.location.search.includes('test=true'));
    }
    return false;
  });

  // Database States
  const [db, setDb] = useState<any>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  
  // Selected Contexts
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [activeScale, setActiveScale] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<Assessment | null>(null);

  // Modals & Compose States
  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState<boolean>(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  
  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warn' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warn' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Syncing metadata helper
  const syncWithCloud = useCallback((token: string | null) => {
    if (!db) return;
    setupClientReplication(db, token, (status, msg) => {
      setSyncStatus(status);
      setSyncMessage(msg);
    });
  }, [db]);

  // Auth Success Callback
  const handleAuthSuccess = (token: string, clinicId: string, username: string, name: string) => {
    setFullName(name);
    setIsAuthenticated(true);
    showToast(`Welcome back, Dr. ${name}!`, 'success');
    initDatabase(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('psychiatryx_token');
    localStorage.removeItem('psychiatryx_clinic_id');
    localStorage.removeItem('psychiatryx_username');
    localStorage.removeItem('psychiatryx_name');
    setIsAuthenticated(false);
    setPatients([]);
    setAssessments([]);
    setPrescriptions([]);
    setActivePatient(null);
    setCurrentView('dashboard');
    showToast('Logged out successfully', 'success');
  };

  // Memoized 7-day cumulative patient growth data
  const patientGrowthData = useMemo(() => {
    const activePatients = patients.filter(p => !p.deleted);
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      d.setHours(23, 59, 59, 999);
      
      const count = activePatients.filter(p => {
        const regDate = p.registeredOn ? new Date(p.registeredOn) : new Date(Date.now());
        return regDate.getTime() <= d.getTime();
      }).length;
      
      const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });
      data.push({ dayLabel, count });
    }
    return data;
  }, [patients]);

  // Memoized assessment distribution percentages
  const assessmentDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    assessments.forEach(a => {
      if (a.type && !a.deleted) {
        counts[a.type] = (counts[a.type] || 0) + 1;
        total++;
      }
    });

    const defaultColors = ['#E63946', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#14B8A6'];
    if (total === 0) {
      return [
        { type: 'none', label: 'None', count: 0, percentage: 100, color: 'var(--text-muted)' }
      ];
    }

    const list = Object.entries(counts).map(([type, val], idx) => {
      const scale = ASSESSMENTS[type];
      const label = scale ? scale.short : type.toUpperCase();
      return {
        type,
        label,
        count: val,
        percentage: Math.round((val / total) * 100),
        color: defaultColors[idx % defaultColors.length]
      };
    });

    return list.sort((a, b) => b.count - a.count);
  }, [assessments]);

  // Initialize Database
  const initDatabase = async (token: string | null) => {
    try {
      const rxdbInstance = await getRxDB();
      setDb(rxdbInstance);

      if (typeof window !== 'undefined') {
        (window as any).rxdb = rxdbInstance;
        (window as any).setupReplication = (forceRestart = false) => {
          const activeToken = localStorage.getItem('psychiatryx_token');
          setupClientReplication(rxdbInstance, activeToken, (status, msg) => {
            setSyncStatus(status);
            setSyncMessage(msg);
          });
        };
      }

      // Load initial local data
      const loadedPatients = await rxdbInstance.patients.find().exec();
      const loadedAssessments = await rxdbInstance.assessments.find().exec();
      const loadedPrescriptions = await rxdbInstance.prescriptions.find().exec();

      setPatients(loadedPatients.map((d: any) => d.toJSON()));
      setAssessments(loadedAssessments.map((d: any) => d.toJSON()));
      setPrescriptions(loadedPrescriptions.map((d: any) => d.toJSON()));

      // Subscribe to live queries
      rxdbInstance.patients.find().$.subscribe((docs: any) => {
        setPatients(docs.map((d: any) => d.toJSON()));
      });
      rxdbInstance.assessments.find().$.subscribe((docs: any) => {
        setAssessments(docs.map((d: any) => d.toJSON()));
      });
      rxdbInstance.prescriptions.find().$.subscribe((docs: any) => {
        setPrescriptions(docs.map((d: any) => d.toJSON()));
      });

      // Setup sync replication
      setupClientReplication(rxdbInstance, token, (status, msg) => {
        setSyncStatus(status);
        setSyncMessage(msg);
      });
    } catch (err) {
      console.error('Failed to init RxDB:', err);
      showToast('Offline database initialization failed', 'error');
    }
  };

  // Check login state and window size on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).getSeverity = getSeverity;
      (window as any).computeDomainScores = computeDomainScores;
      (window as any).ASSESSMENTS = ASSESSMENTS;
      (window as any).factoryReset = factoryReset;
      
      (window as any).dbPut = async (collectionName: string, data: any) => {
        const rxdbInstance = await getRxDB();
        const col = rxdbInstance[collectionName];
        if (!col) throw new Error(`Collection ${collectionName} not found`);
        const clinicId = localStorage.getItem('psychiatryx_clinic_id') || 'dev-clinic-id';
        const payload = {
          ...data,
          clinicId,
          updatedAt: Date.now(),
          deleted: data.deleted || false
        };
        if (!payload.id) {
          payload.id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        }
        let currentRev = 1;
        if (payload._rev) {
          const parts = payload._rev.split('-');
          if (parts.length > 0 && !isNaN(parts[0])) {
            currentRev = parseInt(parts[0]) + 1;
          }
        }
        payload._rev = `${currentRev}-${Math.random().toString(36).substring(2)}`;
        await col.upsert(payload);
        return payload.id;
      };

      (window as any).dbGet = async (collectionName: string, id: string) => {
        const rxdbInstance = await getRxDB();
        const col = rxdbInstance[collectionName];
        if (!col) throw new Error(`Collection ${collectionName} not found`);
        const doc = await col.findOne(id).exec();
        return doc ? doc.toJSON() : null;
      };

      (window as any).dbGetAll = async (collectionName: string) => {
        const rxdbInstance = await getRxDB();
        const col = rxdbInstance[collectionName];
        if (!col) throw new Error(`Collection ${collectionName} not found`);
        const docs = await col.find().exec();
        return docs.map((d: any) => d.toJSON());
      };

      const checkTest = !!(navigator.webdriver || window.location.search.includes('test=true'));
      if (checkTest) {
        document.body.classList.add('no-animations');
        setIsTestEnv(true);
      }

      setIsMobile(window.innerWidth <= 768);
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      window.addEventListener('resize', handleResize);

      const token = localStorage.getItem('psychiatryx_token');
      const storedName = localStorage.getItem('psychiatryx_name');
      const isTest = (navigator.webdriver || window.location.search.includes('test=true')) && !window.location.search.includes('test=false');

      if (token) {
        setIsAuthenticated(true);
        if (storedName) setFullName(storedName);
        initDatabase(token);
      } else if (isTest) {
        // Zero-Auth bypass for Playwright test environment
        setIsAuthenticated(true);
        setFullName('Zero-Auth Tester');
        initDatabase(null);
      }

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // Patient Actions
  const handleSavePatient = async (patientData: any) => {
    if (!db) return null;
    try {
      const col = db.patients;
      const clinicId = localStorage.getItem('psychiatryx_clinic_id') || 'dev-clinic-id';
      
      const payload = {
        ...patientData,
        clinicId,
        updatedAt: Date.now(),
        deleted: false
      };

      if (!payload.id) {
        payload.id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      }
      
      if (!payload.patientId) {
        payload.patientId = `MKS-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // Manage revision
      let currentRev = 1;
      if (payload._rev) {
        const parts = payload._rev.split('-');
        if (parts.length > 0 && !isNaN(parts[0])) {
          currentRev = parseInt(parts[0]) + 1;
        }
      }
      payload._rev = `${currentRev}-${Math.random().toString(36).substring(2)}`;

      await col.upsert(payload);
      showToast(patientData.id ? 'Patient updated' : 'Patient registered', 'success');
      return payload.id;
    } catch (e: any) {
      console.error(e);
      showToast('Error saving patient file: ' + e.message, 'error');
      return null;
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!db) return;
    try {
      // Soft delete patient
      const doc = await db.patients.findOne(id).exec();
      if (doc) {
        const data = doc.toJSON();
        data.deleted = true;
        data.updatedAt = Date.now();
        await db.patients.upsert(data);
      }
      
      // Soft delete patient assessments
      const docAssessments = await db.assessments.find({ selector: { patientId: id } }).exec();
      for (const docA of docAssessments) {
        const dataA = docA.toJSON();
        dataA.deleted = true;
        dataA.updatedAt = Date.now();
        await db.assessments.upsert(dataA);
      }

      // Soft delete prescriptions
      const docPrescriptions = await db.prescriptions.find({ selector: { patientId: id } }).exec();
      for (const docP of docPrescriptions) {
        const dataP = docP.toJSON();
        dataP.deleted = true;
        dataP.updatedAt = Date.now();
        await db.prescriptions.upsert(dataP);
      }

      if (activePatient && activePatient.id === id) {
        setActivePatient(null);
      }
      showToast('Patient record deleted', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('Failed to delete patient: ' + e.message, 'error');
    }
  };

  // Assessment Actions
  const handleStartAssessment = (scaleKey: string) => {
    if (!activePatient) {
      showToast('Select a patient first from the database directory', 'warn');
      setCurrentView('patients');
      return;
    }
    setActiveScale(scaleKey);
    setCurrentView('assessment-taking');
  };

  const handleFinishAssessment = async (answers: number[], notes: string, duration: number) => {
    if (!db || !activePatient || !activeScale) return;

    const scale = ASSESSMENTS[activeScale];
    const totalScore = answers.reduce((sum, val) => sum + (val === -1 ? 0 : val), 0);
    const severity = getSeverity(activeScale, totalScore);

    // Calculate domain scores (if scale has domains)
    const domainScores = computeDomainScores(activeScale, answers);

    // Clinical risk checks
    const alerts = [];
    
    // Depression Suicide item 16 check
    if (activeScale === 'depression' && answers[15] >= 2) {
      alerts.push({
        type: 'critical',
        message: 'Elevated thoughts of death/self-harm (Item 16) — consider immediate clinical safety review'
      });
    }

    // Suicide Risk Assessment critical indicators check
    if (activeScale === 'suicide') {
      const criticalIndices = [2, 3, 4, 6, 7, 16];
      const activeCriticalItems = criticalIndices.filter(idx => answers[idx] >= 1);
      if (activeCriticalItems.length >= 2) {
        alerts.push({
          type: 'critical',
          message: 'Active suicidal ideation indicators present — IMMEDIATE clinical attention required'
        });
      }
    }

    // Scale threshold alert
    if (totalScore >= scale.alertThreshold) {
      alerts.push({
        type: 'warning',
        message: `${scale.short} score of ${totalScore} has met or exceeded the clinical alert threshold (${scale.alertThreshold})`
      });
    }

    const payload = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
      clinicId: localStorage.getItem('psychiatryx_clinic_id') || 'dev-clinic-id',
      updatedAt: Date.now(),
      deleted: false,
      _rev: `1-${Math.random().toString(36).substring(2)}`,
      patientId: activePatient.id,
      type: activeScale,
      score: totalScore,
      maxScore: scale.maxScore,
      severityLabel: severity.label,
      answers,
      domainScores,
      alerts,
      duration,
      date: new Date().toISOString(),
      clinician: fullName || 'Clinician',
      notes
    };

    try {
      await db.assessments.upsert(payload);
      showToast(`${scale.short} Saved successfully`, 'success');
      setCurrentResult(payload);
      setCurrentView('assessment-result');
    } catch (e: any) {
      console.error(e);
      showToast('Failed to save assessment: ' + e.message, 'error');
    }
  };

  const handleSaveAssessmentNotes = async (notes: string) => {
    if (!db || !currentResult) return;
    try {
      const updated = {
        ...currentResult,
        notes,
        updatedAt: Date.now()
      };
      
      // Manage rev
      const parts = updated._rev.split('-');
      const nextRev = parseInt(parts[0]) + 1;
      updated._rev = `${nextRev}-${Math.random().toString(36).substring(2)}`;

      await db.assessments.upsert(updated);
      setCurrentResult(updated);
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!db) return;
    try {
      const doc = await db.assessments.findOne(id).exec();
      if (doc) {
        const data = doc.toJSON();
        data.deleted = true;
        data.updatedAt = Date.now();
        await db.assessments.upsert(data);
      }
      showToast('Assessment record deleted', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('Failed to delete assessment: ' + e.message, 'error');
    }
  };

  // Prescription Actions
  const handleSavePrescription = async (prescriptionData: any) => {
    if (!db) return null;
    try {
      const col = db.prescriptions;
      const clinicId = localStorage.getItem('psychiatryx_clinic_id') || 'dev-clinic-id';
      
      const payload = {
        ...prescriptionData,
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
        clinicId,
        updatedAt: Date.now(),
        deleted: false,
        _rev: `1-${Math.random().toString(36).substring(2)}`
      };

      await col.upsert(payload);
      showToast('Prescription saved!', 'success');
      return payload.id;
    } catch (e: any) {
      console.error(e);
      showToast('Failed to save prescription: ' + e.message, 'error');
      return null;
    }
  };

  const handleDeletePrescription = async (id: string) => {
    if (!db) return;
    try {
      const doc = await db.prescriptions.findOne(id).exec();
      if (doc) {
        const data = doc.toJSON();
        data.deleted = true;
        data.updatedAt = Date.now();
        await db.prescriptions.upsert(data);
      }
      showToast('Prescription deleted', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('Failed to delete prescription: ' + e.message, 'error');
    }
  };

  // Maintenance & Config Reset
  const handleFactoryReset = async () => {
    if (confirm("WARNING: This will permanently delete all local patient data, assessments, prescriptions, and authentication tokens.\n\nAre you sure you want to reset this client?")) {
      try {
        await factoryReset();
        showToast("Database successfully reset. Reloading...", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (e: any) {
        console.error("Factory reset failed:", e);
        alert("Failed to reset database: " + e.message);
      }
    }
  };

  return (
    <MotionConfig transition={isTestEnv ? { duration: 0 } : undefined}>
      <div className="app-container">
        {/* Particle Canvas Visualizer */}
        <BackgroundLattice />

        {/* Global Toast Alert banner */}
        <AnimatePresence>
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              isTestEnv={isTestEnv} 
            />
          )}
        </AnimatePresence>

        {/* Fullscreen Authentication overlay */}
        {!isAuthenticated && (
          <AuthOverlay 
            onAuthSuccess={handleAuthSuccess} 
            isTestEnv={isTestEnv} 
          />
        )}
        <div id="app" className={!isAuthenticated ? 'hidden' : ''} style={{ display: !isAuthenticated ? 'none' : 'flex', minHeight: '100vh' }}>
          {isAuthenticated && (
            <>
              {/* Sidebar Navigation */}
              <Sidebar
                currentView={currentView}
                setCurrentView={setCurrentView}
                activePatient={activePatient}
                setActivePatient={setActivePatient}
                patients={patients}
                assessments={assessments}
                patientGrowthData={patientGrowthData}
                assessmentDistribution={assessmentDistribution}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                logout={handleLogout}
                isTestEnv={isTestEnv}
                fullName={fullName}
                onStartAssessment={handleStartAssessment}
              />

              {/* Mobile Sidebar Backdrop overlay */}
              {isMobileMenuOpen && (
                <div 
                  className="sidebar-backdrop active" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ display: 'block' }}
                />
              )}

              {/* Main Content Area */}
              <div id="main" style={{ marginLeft: isMobile ? 0 : 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Header
                  currentView={currentView}
                  activeScale={activeScale}
                  activePatient={activePatient}
                  setActivePatient={setActivePatient}
                  syncStatus={syncStatus}
                  syncMessage={syncMessage}
                  isMobile={isMobile}
                  isMobileMenuOpen={isMobileMenuOpen}
                  setIsMobileMenuOpen={setIsMobileMenuOpen}
                  onNewPatientClick={() => {
                    setEditingPatient(null);
                    setIsPatientModalOpen(true);
                  }}
                  logout={handleLogout}
                />

                <main style={{ padding: '28px', flex: 1, position: 'relative', zIndex: 20 }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentView}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={isTestEnv ? { duration: 0 } : { duration: 0.2 }}
                    >
                      {/* View: Dashboard */}
                      {currentView === 'dashboard' && (
                        <DashboardView
                          patients={patients}
                          assessments={assessments}
                          prescriptions={prescriptions}
                          setActivePatient={setActivePatient}
                          setCurrentView={setCurrentView}
                          isTestEnv={isTestEnv}
                        />
                      )}

                      {/* View: Patient Database & Register */}
                      {currentView === 'patients' && (
                        <PatientDatabase
                          patients={patients}
                          onSavePatient={handleSavePatient}
                          onDeletePatient={handleDeletePatient}
                          setActivePatient={setActivePatient}
                          setCurrentView={setCurrentView}
                          isModalOpen={isPatientModalOpen}
                          setIsModalOpen={setIsPatientModalOpen}
                          editingPatient={editingPatient}
                          setEditingPatient={setEditingPatient}
                          isTestEnv={isTestEnv}
                        />
                      )}

                      {/* View: Assessments Grid */}
                      {currentView === 'assessments' && (
                        <RunAssessment
                          activePatient={activePatient}
                          assessments={assessments}
                          onStartAssessment={handleStartAssessment}
                          isTestEnv={isTestEnv}
                        />
                      )}

                      {/* View: Assessment Question-Taking */}
                      {currentView === 'assessment-taking' && activeScale && activePatient && (
                        <AssessmentTaking
                          activeScale={activeScale}
                          activePatient={activePatient}
                          onFinish={handleFinishAssessment}
                          onCancel={() => setCurrentView('assessments')}
                          isTestEnv={isTestEnv}
                        />
                      )}

                      {/* View: Assessment Result Display */}
                      {currentView === 'assessment-result' && currentResult && activePatient && (
                        <AssessmentResult
                          activePatient={activePatient}
                          assessment={currentResult}
                          onSaveNotes={handleSaveAssessmentNotes}
                          onClose={() => {
                            setCurrentResult(null);
                            setCurrentView('patient-profile');
                          }}
                          isTestEnv={isTestEnv}
                        />
                      )}

                      {/* View: Patient profile */}
                      {currentView === 'patient-profile' && activePatient && (
                        <PatientProfile
                          activePatient={activePatient}
                          assessments={assessments}
                          prescriptions={prescriptions}
                          onOpenEditModal={(p) => {
                            // Pass selected patient to form state in PatientDatabase via callback
                            setEditingPatient(p);
                            setIsPatientModalOpen(true);
                          }}
                          onDeleteAssessment={handleDeleteAssessment}
                          setCurrentView={setCurrentView}
                          onStartAssessment={handleStartAssessment}
                          onNewRxClick={() => {
                            setCurrentView('prescriptions');
                            setIsPrescriptionModalOpen(true);
                          }}
                          isTestEnv={isTestEnv}
                        />
                      )}

                      {/* View: Prescription Builder */}
                      {currentView === 'prescriptions' && (
                        <PrescriptionBuilder
                          prescriptions={prescriptions}
                          patients={patients}
                          activePatient={activePatient}
                          isModalOpen={isPrescriptionModalOpen}
                          setIsModalOpen={setIsPrescriptionModalOpen}
                          onSavePrescription={handleSavePrescription}
                          onDeletePrescription={handleDeletePrescription}
                          showToast={showToast}
                          isTestEnv={isTestEnv}
                        />
                      )}

                      {/* View: Reports Directory */}
                      {currentView === 'reports' && (
                        <ReportsGenerator
                          patients={patients}
                          assessments={assessments}
                          isTestEnv={isTestEnv}
                        />
                      )}

                      {/* View: Settings */}
                      {currentView === 'settings' && (
                        <SettingsPanel
                          onFactoryReset={handleFactoryReset}
                          isTestEnv={isTestEnv}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </main>
              </div>

              {isAuthenticated && isPatientModalOpen && currentView !== 'patients' && (
                <PatientDatabase
                  patients={patients}
                  onSavePatient={handleSavePatient}
                  onDeletePatient={handleDeletePatient}
                  setActivePatient={setActivePatient}
                  setCurrentView={setCurrentView}
                  isModalOpen={isPatientModalOpen}
                  setIsModalOpen={setIsPatientModalOpen}
                  editingPatient={editingPatient}
                  setEditingPatient={setEditingPatient}
                  isTestEnv={isTestEnv}
                  onlyModal={true}
                />
              )}
            </>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}
