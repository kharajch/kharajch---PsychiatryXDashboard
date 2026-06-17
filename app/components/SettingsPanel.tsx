'use client';

import React, { useState, useEffect } from 'react';
import { FaCog, FaTrash, FaSpinner, FaSave } from 'react-icons/fa';
import styles from './SettingsPanel.module.css';

interface SettingsPanelProps {
  onFactoryReset: () => Promise<void>;
  isTestEnv: boolean;
}

export default function SettingsPanel({
  onFactoryReset,
  isTestEnv
}: SettingsPanelProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // PDF settings
  const [doctorName, setDoctorName] = useState('Demo Doctor M.D (Psychiatry)');
  const [clinicName, setClinicName] = useState('PsychiatryX Clinic');
  const [clinicAddr, setClinicAddr] = useState('Clinic Address Line 1, City, State, ZIP');
  const [clinicPhone, setClinicPhone] = useState('+1 (555) 019-2834');
  const [clinicEmail, setClinicEmail] = useState('contact@psychiatryx.com');
  const [clinicReg, setClinicReg] = useState('Reg No: MD-99283-A');

  // Load settings on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDoctorName(localStorage.getItem('doctor_name') || 'Demo Doctor M.D (Psychiatry)');
      setClinicName(localStorage.getItem('clinic_name') || 'PsychiatryX Clinic');
      setClinicAddr(localStorage.getItem('clinic_addr') || 'Clinic Address Line 1, City, State, ZIP');
      setClinicPhone(localStorage.getItem('clinic_phone') || '+1 (555) 019-2834');
      setClinicEmail(localStorage.getItem('clinic_email') || 'contact@psychiatryx.com');
      setClinicReg(localStorage.getItem('clinic_reg') || 'Reg No: MD-99283-A');
    }
  }, []);

  const handleSaveSettings = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('doctor_name', doctorName.trim());
      localStorage.setItem('clinic_name', clinicName.trim());
      localStorage.setItem('clinic_addr', clinicAddr.trim());
      localStorage.setItem('clinic_phone', clinicPhone.trim());
      localStorage.setItem('clinic_email', clinicEmail.trim());
      localStorage.setItem('clinic_reg', clinicReg.trim());
      alert('Clinic settings saved successfully! These changes will be applied to all future printed PDFs.');
    } catch (e) {
      console.error(e);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onFactoryReset();
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Clinic Settings & Configuration</h1>

      <div className={styles.settingsLayout}>
        {/* PDF Layout Configuration Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><FaCog /> PDF Header Configuration</span>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="field">
                <label>Doctor Name & Credentials</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Clinic / Hospital Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Clinic Registration / License Number</label>
                <input
                  type="text"
                  value={clinicReg}
                  onChange={(e) => setClinicReg(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Clinic Address</label>
                <input
                  type="text"
                  value={clinicAddr}
                  onChange={(e) => setClinicAddr(e.target.value)}
                />
              </div>
              <div className="grid-2-equal">
                <div className="field">
                  <label>Clinic Contact Phone</label>
                  <input
                    type="text"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Clinic Contact Email</label>
                  <input
                    type="text"
                    value={clinicEmail}
                    onChange={(e) => setClinicEmail(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FaSave /> Save Layout Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance / Factory Reset Card */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Platform Information</span>
            </div>
            <div className="card-body" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              <p style={{ margin: '0 0 8px' }}><strong>Status:</strong> Online / Sync Enabled</p>
              <p style={{ margin: '0 0 8px' }}><strong>Tenancy:</strong> Multi-tenant Clinician Scoped</p>
              <p style={{ margin: '0 0 8px' }}><strong>Local Storage:</strong> RxDB IndexDB (Offline First)</p>
              <p style={{ margin: '0 0 8px' }}><strong>Deployment:</strong> Vercel Production Client</p>
              <p style={{ margin: '0' }}><strong>Platform Version:</strong> v1.0.0-production</p>
            </div>
          </div>

          <div className={styles.warningSection}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
              Danger Zone
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Performing a factory reset will permanently erase all local databases, patient credentials, settings and active sync tokens. Ensure cloud backup has synchronized before proceeding.
            </p>
            <button 
              className={styles.dangerBtn}
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? <FaSpinner className="spinner" /> : <FaTrash />} Factory Reset Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
