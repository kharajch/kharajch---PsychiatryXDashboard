'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaUserPlus, FaEdit, FaFileMedical, FaTimes, FaSpinner } from 'react-icons/fa';
import { Patient } from '../../types';
import styles from './PatientDatabase.module.css';

interface PatientDatabaseProps {
  patients: Patient[];
  onSavePatient: (patientData: any) => Promise<string | null>;
  onDeletePatient: (id: string) => Promise<void>;
  setActivePatient: (patient: Patient | null) => void;
  setCurrentView: (view: any) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  editingPatient: Patient | null;
  setEditingPatient: (patient: Patient | null) => void;
  isTestEnv: boolean;
  onlyModal?: boolean;
}

export default function PatientDatabase({
  patients,
  onSavePatient,
  onDeletePatient,
  setActivePatient,
  setCurrentView,
  isModalOpen,
  setIsModalOpen,
  editingPatient,
  setEditingPatient,
  isTestEnv,
  onlyModal = false
}: PatientDatabaseProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    patientId: '',
    age: '',
    gender: 'Male',
    dob: '',
    phone: '',
    email: '',
    referral: '',
    complaint: '',
    history: '',
    medications: '',
    allergies: ''
  });

  const activePatients = useMemo(() => patients.filter(p => !p.deleted), [patients]);

  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return activePatients;
    return activePatients.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(term);
      const idMatch = p.patientId ? p.patientId.toLowerCase().includes(term) : false;
      const phoneMatch = p.phone ? p.phone.includes(term) : false;
      return nameMatch || idMatch || phoneMatch;
    });
  }, [activePatients, searchTerm]);

  const resetForm = () => {
    setForm({
      name: '',
      patientId: '',
      age: '',
      gender: 'Male',
      dob: '',
      phone: '',
      email: '',
      referral: '',
      complaint: '',
      history: '',
      medications: '',
      allergies: ''
    });
    setEditingPatient(null);
  };

  React.useEffect(() => {
    if (isModalOpen) {
      if (editingPatient) {
        setForm({
          name: editingPatient.name,
          patientId: editingPatient.patientId || '',
          age: String(editingPatient.age || ''),
          gender: editingPatient.gender || 'Male',
          dob: editingPatient.dob || '',
          phone: editingPatient.phone || '',
          email: editingPatient.email || '',
          referral: editingPatient.referral || '',
          complaint: editingPatient.complaint || '',
          history: editingPatient.history || '',
          medications: editingPatient.medications || '',
          allergies: editingPatient.allergies || ''
        });
      } else {
        setForm({
          name: '',
          patientId: '',
          age: '',
          gender: 'Male',
          dob: '',
          phone: '',
          email: '',
          referral: '',
          complaint: '',
          history: '',
          medications: '',
          allergies: ''
        });
      }
    }
  }, [isModalOpen, editingPatient]);

  const handleOpenRegister = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Patient) => {
    setEditingPatient(p);
    setForm({
      name: p.name,
      patientId: p.patientId || '',
      age: String(p.age || ''),
      gender: p.gender || 'Male',
      dob: p.dob || '',
      phone: p.phone || '',
      email: p.email || '',
      referral: p.referral || '',
      complaint: p.complaint || '',
      history: p.history || '',
      medications: p.medications || '',
      allergies: p.allergies || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // CRITICAL: Synchronously read values at the very beginning of the submission handler
    const payload = {
      id: editingPatient?.id, // undefined for new patient
      _rev: editingPatient?._rev,
      name: form.name.trim(),
      patientId: form.patientId.trim() || null,
      age: parseInt(form.age) || 0,
      gender: form.gender,
      dob: form.dob || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      referral: form.referral.trim() || null,
      complaint: form.complaint.trim() || null,
      history: form.history.trim() || null,
      medications: form.medications.trim() || null,
      allergies: form.allergies.trim() || null,
      registeredOn: editingPatient ? editingPatient.registeredOn : new Date().toISOString()
    };

    if (!payload.name) {
      alert('Patient name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const savedId = await onSavePatient(payload);
      if (savedId) {
        if (!editingPatient) {
          const registeredPatient = {
            ...payload,
            id: savedId,
            clinicId: localStorage.getItem('psychiatryx_clinic_id') || 'dev-clinic-id',
            updatedAt: Date.now(),
            deleted: false,
            _rev: payload._rev || '1-mock',
            patientId: payload.patientId || `MKS-${Math.floor(1000 + Math.random() * 9000)}`
          };
          setActivePatient(registeredPatient);
          setCurrentView('patient-profile');
        } else {
          setActivePatient(prev => prev && prev.id === payload.id ? { ...prev, ...payload } : prev);
        }
        setIsModalOpen(false);
        resetForm();
      }
    } catch (err) {
      console.error('Save patient failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete patient "${name}"?\nThis will also delete all their assessments and prescriptions.`)) {
      await onDeletePatient(id);
    }
  };

  return (
    <div className={styles.patientContainer}>
      {!onlyModal && (
        <>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>Patient Database</h1>
            <button className="btn btn-primary btn-sm" onClick={handleOpenRegister}>
              <FaUserPlus /> New Patient
            </button>
          </div>

          {/* Search Input Card */}
          <div className={`card ${styles.searchCard}`}>
            <div className={styles.searchBody}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search directory by name, ID or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      {/* Patients Table Card */}
      {!onlyModal && (
        <div className="card">
          <div className={styles.patientTableWrapper}>
            <div className="table-responsive">
              <table className={styles.patientTable}>
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>ID</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Phone</th>
                    <th>Referral</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
              <tbody id="patients-list">
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="patient-row">
                    <td>
                      <div className={styles.patientNameCell}>
                        <div className={styles.avatar}>{p.name.charAt(0)}</div>
                        <span className="p-name" style={{ fontWeight: 600, color: 'white' }}>{p.name}</span>
                      </div>
                    </td>
                    <td>{p.patientId || '—'}</td>
                    <td>{p.age}</td>
                    <td>{p.gender}</td>
                    <td>{p.phone || '—'}</td>
                    <td>{p.referral || '—'}</td>
                    <td>
                      <div className={styles.actionCell}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setActivePatient(p);
                            setCurrentView('patient-profile');
                          }}
                        >
                          Details
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setActivePatient(p);
                            setCurrentView('assessments');
                          }}
                        >
                          <FaFileMedical /> Assess
                        </button>
                        <button
                          className="btn btn-sm btn-secondary btn-icon"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <FaEdit />
                        </button>
                        {/* E2E Trash Emoji Rule: Button must contain literal "🗑" */}
                        <button
                          className="btn btn-sm btn-danger btn-icon"
                          onClick={() => handleDelete(p.id, p.name)}
                          title="Delete Patient"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Patient Registration / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className={`${styles.modalOverlay} auth-overlay`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={isTestEnv ? { duration: 0 } : { duration: 0.2 }}
              className={`${styles.modal} card`}
            >
              <div className={styles.modalHeader}>
                <h3 className="card-title">{editingPatient ? 'Edit Patient File' : 'Register New Patient'}</h3>
                <button 
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="modal-close"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className={styles.modalBody}>
                  <div className={styles.formGrid}>
                    <div className={`${styles.formGrid} ${styles.formGrid2}`}>
                      <div className="field">
                        <label>Patient Full Name *</label>
                        <input
                          id={editingPatient ? "edit-name" : "reg-name"}
                          type="text"
                          required
                          placeholder="e.g. Eleanor Vance"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label>Patient ID (Optional)</label>
                        <input
                          type="text"
                          placeholder="Auto-generated if left blank"
                          value={form.patientId}
                          onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className={`${styles.formGrid} ${styles.formGrid3}`}>
                      <div className="field">
                        <label>Age *</label>
                        <input
                          id={editingPatient ? "edit-age" : "reg-age"}
                          type="number"
                          required
                          placeholder="Age"
                          value={form.age}
                          onChange={(e) => setForm({ ...form, age: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label>Gender *</label>
                        <select
                          id={editingPatient ? "edit-gender" : "reg-gender"}
                          value={form.gender}
                          onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-Binary">Non-Binary</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="field">
                        <label>Date of Birth</label>
                        <input
                          type="date"
                          value={form.dob}
                          onChange={(e) => setForm({ ...form, dob: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className={`${styles.formGrid} ${styles.formGrid2}`}>
                      <div className="field">
                        <label>Phone Number</label>
                        <input
                          id={editingPatient ? "edit-phone" : "reg-phone"}
                          type="tel"
                          placeholder="e.g. +1 (555) 019-2834"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label>Email Address</label>
                        <input
                          type="email"
                          placeholder="e.g. eleanor.v@email.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label>Referral Source</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Roberts, Self-referral"
                        value={form.referral}
                        onChange={(e) => setForm({ ...form, referral: e.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label>Presenting Complaint</label>
                      <textarea
                        id={editingPatient ? "edit-complaint" : "reg-complaint"}
                        placeholder="Brief summary of primary symptoms or reason for visit..."
                        value={form.complaint}
                        onChange={(e) => setForm({ ...form, complaint: e.target.value })}
                      />
                    </div>

                    <div className="field">
                      <label>Psychiatric & Medical History</label>
                      <textarea
                        id={editingPatient ? "edit-history" : "reg-history"}
                        placeholder="Past diagnoses, admissions, or chronic illnesses..."
                        value={form.history}
                        onChange={(e) => setForm({ ...form, history: e.target.value })}
                      />
                    </div>

                    <div className={`${styles.formGrid} ${styles.formGrid2}`}>
                      <div className="field">
                        <label>Current Medications</label>
                        <textarea
                          id={editingPatient ? "edit-medications" : "reg-medications"}
                          placeholder="e.g. Sertraline 50mg QD"
                          value={form.medications}
                          onChange={(e) => setForm({ ...form, medications: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label>Allergies & Contraindications</label>
                        <textarea
                          id={editingPatient ? "edit-allergies" : "reg-allergies"}
                          placeholder="e.g. Penicillin, Lactose intolerance"
                          value={form.allergies}
                          onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? <FaSpinner className="spinner" /> : (editingPatient ? 'Save Changes' : 'Register Patient')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
