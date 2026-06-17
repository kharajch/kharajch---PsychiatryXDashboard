'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaLock, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { gsap } from 'gsap';
import styles from './AuthOverlay.module.css';

interface AuthOverlayProps {
  onAuthSuccess: (token: string, clinicId: string, username: string, name: string) => void;
  isTestEnv: boolean;
}

export default function AuthOverlay({ onAuthSuccess, isTestEnv }: AuthOverlayProps) {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current && !isTestEnv) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, [view, isTestEnv]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username and Password are required');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('psychiatryx_token', data.token);
      localStorage.setItem('psychiatryx_clinic_id', data.user.clinicId);
      localStorage.setItem('psychiatryx_username', data.user.username);
      localStorage.setItem('psychiatryx_name', data.user.name);

      onAuthSuccess(data.token, data.user.clinicId, data.user.username, data.user.name);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !confirmPassword || !fullName || !clinicName) {
      setError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name: fullName, clinicName })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Auto login on success
      localStorage.setItem('psychiatryx_token', data.token);
      localStorage.setItem('psychiatryx_clinic_id', data.user.clinicId);
      localStorage.setItem('psychiatryx_username', data.user.username);
      localStorage.setItem('psychiatryx_name', data.user.name);

      onAuthSuccess(data.token, data.user.clinicId, data.user.username, data.user.name);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/dev/seed');
      if (!res.ok) {
        throw new Error('Failed to seed database');
      }
      
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'password123' })
      });
      const loginData = await loginRes.json();
      
      if (!loginRes.ok) {
        throw new Error(loginData.error || 'Authentication failed');
      }

      localStorage.setItem('psychiatryx_token', loginData.token);
      localStorage.setItem('psychiatryx_clinic_id', loginData.user.clinicId);
      localStorage.setItem('psychiatryx_username', loginData.user.username);
      localStorage.setItem('psychiatryx_name', loginData.user.name);

      onAuthSuccess(loginData.token, loginData.user.clinicId, loginData.user.username, loginData.user.name);
    } catch (err: any) {
      setError('Demo Login failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${styles.authOverlay} auth-overlay`} id="auth-container">
      <div className={`${styles.authOrb} ${styles.authOrbPrimary}`} />
      <div className={`${styles.authOrb} ${styles.authOrbSecondary}`} />
      
      <div className={styles.authParticles}>
        <div className={`${styles.authParticle} ${styles.authParticle1}`} />
        <div className={`${styles.authParticle} ${styles.authParticle2}`} />
        <div className={`${styles.authParticle} ${styles.authParticle3}`} />
        <div className={`${styles.authParticle} ${styles.authParticle4}`} />
        <div className={`${styles.authParticle} ${styles.authParticle5}`} />
        <div className={`${styles.authParticle} ${styles.authParticle6}`} />
      </div>

      <div className={styles.authCardWrapper}>
        <div className={`${styles.authCard} auth-card card`} ref={cardRef}>
          <div className={styles.authLogo}>
            <h1 className={styles.authLogoText} style={{ color: 'rgb(230, 57, 70)', fontSize: '24px', fontWeight: 800, letterSpacing: '3px', margin: 0 }}>PSYCHIATRYX</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px', marginBottom: 0 }}>Clinical Intelligence Dashboard</p>
          </div>

          <div className={styles.authHeader}>
            <h2>{view === 'login' ? 'Clinician Sign In' : 'Create Clinician Account'}</h2>
            <p>{view === 'login' ? 'Access patient records and assessments' : 'Register a new clinical tenancy'}</p>
          </div>

          {error && (
            <div className={styles.authError}>
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}

          {view === 'login' ? (
            <form onSubmit={handleLogin} className={styles.authForm}>
              <div className="field">
                <label>Username</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-username"
                    type="text"
                    required
                    placeholder="Enter clinician username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <FaUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="field">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <FaLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className={styles.authBtnGroup}>
                <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%', justifyContent: 'center' }}>
                  {isLoading ? <FaSpinner className="spinner" /> : 'Sign In'}
                </button>

                <button type="button" onClick={handleDemoSignIn} className={styles.btnDemo} disabled={isLoading}>
                  <FaCheckCircle /> Demo Clinician Access
                </button>
              </div>

              <div className={styles.authFooter}>
                Don't have an account?{' '}
                <a onClick={() => { setView('register'); setError(''); }}>Create Account</a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className={styles.authForm}>
              <div className="field">
                <label>Full Clinician Name</label>
                <input
                  id="reg-user-fullname"
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Jenkins M.D."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Clinic / Hospital Name</label>
                <input
                  id="reg-user-clinicname"
                  type="text"
                  required
                  placeholder="e.g. Metro Psychiatric Services"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Username</label>
                <input
                  id="reg-user-username"
                  type="text"
                  required
                  placeholder="Choose login username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-grid-2 grid-2-equal">
                <div className="field">
                  <label>Password</label>
                  <input
                    id="reg-user-password"
                    type="password"
                    required
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Confirm</label>
                  <input
                    id="reg-user-confirm-password"
                    type="password"
                    required
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.authBtnGroup}>
                <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%', justifyContent: 'center' }}>
                  {isLoading ? <FaSpinner className="spinner" /> : 'Create Account'}
                </button>
              </div>

              <div className={styles.authFooter}>
                Already registered?{' '}
                <a onClick={() => { setView('login'); setError(''); }}>Sign In</a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
