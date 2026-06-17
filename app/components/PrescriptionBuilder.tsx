'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilePrescription, FaFilePdf, FaTimes, FaPlus, FaSpinner } from 'react-icons/fa';
import { Patient, Prescription, Medicine } from '../../types';
import { generatePrescriptionPDF } from '../../lib/pdf-utils';
import styles from './PrescriptionBuilder.module.css';

interface PrescriptionBuilderProps {
  prescriptions: Prescription[];
  patients: Patient[];
  activePatient: Patient | null;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  onSavePrescription: (data: any) => Promise<string | null>;
  onDeletePrescription: (id: string) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'warn') => void;
  isTestEnv: boolean;
}

export default function PrescriptionBuilder({
  prescriptions,
  patients,
  activePatient,
  isModalOpen,
  setIsModalOpen,
  onSavePrescription,
  onDeletePrescription,
  showToast,
  isTestEnv
}: PrescriptionBuilderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '',
    notes: '',
    followup: '',
    investigations: '',
    patientInstructions: ''
  });
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medForm, setMedForm] = useState({
    name: '',
    frequency: '1-0-1',
    timing: 'After Food',
    duration: '5 Days',
    instructions: ''
  });

  const activePrescriptions = useMemo(() => prescriptions.filter(p => !p.deleted), [prescriptions]);

  const resetComposer = () => {
    setPrescriptionForm({
      diagnosis: '',
      notes: '',
      followup: '',
      investigations: '',
      patientInstructions: ''
    });
    setMedicines([]);
    setMedForm({
      name: '',
      frequency: '1-0-1',
      timing: 'After Food',
      duration: '5 Days',
      instructions: ''
    });
  };

  const handleLoadRx = (pres: Prescription) => {
    setPrescriptionForm({
      diagnosis: pres.diagnosis || '',
      notes: pres.notes || '',
      followup: pres.followup || '',
      investigations: pres.investigations || '',
      patientInstructions: pres.patientInstructions || ''
    });
    setMedicines(pres.medicines.map(m => ({
      id: m.id,
      name: m.name,
      frequency: m.frequency,
      timing: m.timing,
      duration: m.duration,
      instructions: m.instructions
    })));
    setIsModalOpen(true);
    showToast('Prescription loaded', 'success');
  };

  const handleAddMedicine = () => {
    const medName = medForm.name.trim();
    if (!medName) {
      alert('Medicine name is required');
      return;
    }
    const newMed: Medicine = {
      id: Date.now(),
      name: medName,
      frequency: medForm.frequency.trim(),
      timing: medForm.timing,
      duration: medForm.duration.trim(),
      instructions: medForm.instructions.trim()
    };
    setMedicines([...medicines, newMed]);
    setMedForm({
      name: '',
      frequency: '1-0-1',
      timing: 'After Food',
      duration: '5 Days',
      instructions: ''
    });
  };

  const handleRemoveMedicine = (id: number) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  const handleSubmit = async () => {
    if (!activePatient) return;
    setIsSubmitting(true);
    
    // Copy form state synchronously
    const payload = {
      patientId: activePatient.id,
      date: new Date().toISOString(),
      diagnosis: prescriptionForm.diagnosis.trim(),
      notes: prescriptionForm.notes.trim(),
      followup: prescriptionForm.followup.trim(),
      investigations: prescriptionForm.investigations.trim(),
      patientInstructions: prescriptionForm.patientInstructions.trim(),
      medicines: medicines.map((m, idx) => ({
        id: idx + 1,
        name: m.name,
        frequency: m.frequency,
        timing: m.timing,
        duration: m.duration,
        instructions: m.instructions
      }))
    };

    try {
      const savedId = await onSavePrescription(payload);
      if (savedId) {
        setIsModalOpen(false);
        resetComposer();
        // Trigger auto PDF generation
        const fullPresc = { ...payload, id: savedId, deleted: false, _rev: '', clinicId: '', updatedAt: Date.now() };
        generatePrescriptionPDF(fullPresc, activePatient);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this prescription?')) {
      await onDeletePrescription(id);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className={styles.title}>Clinic Prescriptions Log</h1>
        <button 
          className="btn btn-primary btn-sm" 
          onClick={() => { resetComposer(); setIsModalOpen(true); }} 
          disabled={!activePatient}
        >
          <FaFilePrescription /> Compose Prescription
        </button>
      </div>

      {!activePatient && (
        <div className="alert alert-info">
          <span>Please select a patient from the directory to compose or view prescriptions.</span>
        </div>
      )}

      {/* Global Prescriptions Table */}
      <div className="card">
        <div className="table-responsive">
          <table className={styles.rxTable}>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Diagnosis</th>
                <th>Date</th>
                <th>Medicines Issued</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activePrescriptions.map(pres => {
                const pObj = patients.find(p => p.id === pres.patientId);
                return (
                  <tr key={pres.id}>
                    <td style={{ fontWeight: 600, color: 'white' }}>{pObj ? pObj.name : 'Unknown Patient'}</td>
                    <td>{pres.diagnosis || 'Deferred'}</td>
                    <td>{new Date(pres.date).toLocaleDateString()}</td>
                    <td>{pres.medicines.map(m => m.name).join(', ')}</td>
                    <td>
                      <div className={styles.actionCell}>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => handleLoadRx(pres)}
                        >
                          Load
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary" 
                          onClick={() => pObj && generatePrescriptionPDF(pres, pObj)}
                        >
                          <FaFilePdf /> Export PDF
                        </button>
                        {/* E2E Trash Emoji Rule: Button must contain literal "🗑" */}
                        <button 
                          className="btn btn-sm btn-danger btn-icon" 
                          onClick={() => handleDelete(pres.id)}
                          title="Delete Prescription"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {activePrescriptions.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No prescriptions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Compose Prescription */}
      <AnimatePresence>
        {isModalOpen && activePatient && (
          <div className={`${styles.modalOverlay} auth-overlay`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={isTestEnv ? { duration: 0 } : { duration: 0.2 }}
              className="card" 
              style={{ width: '720px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div className="card-header">
                <span className="card-title">Compose Prescription for {activePatient.name}</span>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="modal-close"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="card-body">
                <div className="field">
                  <label>Diagnosis / Clinical Impression</label>
                  <input 
                    id="rx-diagnosis"
                    type="text"
                    placeholder="e.g. Major Depressive Disorder (Moderate)"
                    value={prescriptionForm.diagnosis}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                  />
                </div>

                {/* Add Medicine Section */}
                <div className={styles.medListSection}>
                  <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '12px', fontWeight: 700 }}>
                    Add Medicine
                  </h3>
                  
                  <div className="grid-2-equal">
                    <div className="field">
                      <label>Medicine Name & Strength</label>
                      <input 
                        id="rx-med-name"
                        type="text" 
                        placeholder="e.g. Escitalopram 10mg"
                        value={medForm.name}
                        onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>Frequency (Dose Schedule)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1-0-0 (Morning only)"
                        value={medForm.frequency}
                        onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid-3-equal" style={{ marginTop: '12px' }}>
                    <div className="field">
                      <label>Timing</label>
                      <select 
                        value={medForm.timing}
                        onChange={(e) => setMedForm({ ...medForm, timing: e.target.value })}
                      >
                        <option value="After Food">After Food</option>
                        <option value="Before Food">Before Food</option>
                        <option value="With Food">With Food</option>
                        <option value="Bedtime">Bedtime</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Duration</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 1 Month"
                        value={medForm.duration}
                        onChange={(e) => setMedForm({ ...medForm, duration: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>Special Instructions</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Take with water"
                        value={medForm.instructions}
                        onChange={(e) => setMedForm({ ...medForm, instructions: e.target.value })}
                      />
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    style={{ width: '100%', marginTop: '16px' }} 
                    onClick={handleAddMedicine}
                  >
                    <FaPlus /> Add to Prescription
                  </button>
                </div>

                {/* Medicines List Preview */}
                {medicines.length > 0 && (
                  <div className="table-responsive" style={{ marginBottom: '20px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Schedule</th>
                          <th>Timing</th>
                          <th>Duration</th>
                          <th style={{ textAlign: 'right' }}>Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicines.map((m) => (
                          <tr key={m.id}>
                            <td style={{ fontWeight: 600, color: 'white' }}>{m.name}</td>
                            <td>{m.frequency}</td>
                            <td>{m.timing}</td>
                            <td>{m.duration}</td>
                            <td style={{ textAlign: 'right' }}>
                              {/* E2E Trash Emoji Rule: Button must contain literal "🗑" */}
                              <button 
                                className="btn btn-danger btn-sm btn-icon" 
                                onClick={() => handleRemoveMedicine(m.id)}
                              >
                                🗑
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="field">
                  <label>Clinical Notes / Recommendations</label>
                  <textarea 
                    placeholder="Regular sleep hygiene, mild cardio exercise..."
                    value={prescriptionForm.notes}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                  />
                </div>

                <div className="grid-2-equal" style={{ marginTop: '12px' }}>
                  <div className="field">
                    <label>Required Investigations / Tests</label>
                    <input 
                      type="text" 
                      placeholder="CBC, Thyroid Profile (TSH), Serum Sodium"
                      value={prescriptionForm.investigations}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, investigations: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Follow-up Date / Timeline</label>
                    <input 
                      type="text" 
                      placeholder="2 Weeks"
                      value={prescriptionForm.followup}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, followup: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field" style={{ marginTop: '12px' }}>
                  <label>Patient Instructions (Printed on PDF)</label>
                  <textarea 
                    placeholder="If any adverse reactions occur, contact clinic immediately..."
                    value={prescriptionForm.patientInstructions}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patientInstructions: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => { setIsModalOpen(false); resetComposer(); }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleSubmit}
                    disabled={isSubmitting || medicines.length === 0}
                  >
                    {isSubmitting ? <FaSpinner className="spinner" /> : 'Save Rx'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
