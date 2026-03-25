// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import styles from './RegisterPage.module.css';

const ROLES = [
  {
    value: 'tester',
    label: 'Tester',
    icon: '🧪',
    desc: 'Report and track bugs. Assign bugs to developers.',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    value: 'developer',
    label: 'Developer',
    icon: '💻',
    desc: 'Get assigned bugs and resolve them via the Kanban board.',
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    value: 'productowner',
    label: 'Product Owner',
    icon: '📊',
    desc: 'View all bugs and generate project-level defect reports.',
    color: '#10b981',
    bg: '#ecfdf5',
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();

  const [step,      setStep]      = useState(1); // 1=pick role, 2=fill form
  const [role,      setRole]      = useState('');
  const [userName,  setUserName]  = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);

  const selectedRole = ROLES.find(r => r.value === role);

  const handleRoleSelect = (r) => {
    setRole(r);
    setStep(2);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!userName.trim())        return setError('Username is required.');
    if (password.length < 6)     return setError('Password must be at least 6 characters.');
    if (password !== confirm)    return setError('Passwords do not match.');

    setLoading(true);
    try {
      await registerUser(userName.trim(), password, role);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data || 'Registration failed. Try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Left panel */}
      <div className={styles.left}>
        <div className={styles.logoWrap}>
          <div className={styles.logoBox}>B</div>
          <span className={styles.logoName}>BugTrackr</span>
        </div>
        <div className={styles.heroText}>
          <h1>Join your team<br/>on BugTrackr</h1>
          <p>Create an account and start collaborating on bug tracking today.</p>
        </div>
        <div className={styles.rolePreview}>
          {ROLES.map(r => (
            <div key={r.value} className={`${styles.rolePreviewItem} ${role === r.value ? styles.rolePreviewActive : ''}`}
              style={role === r.value ? { borderColor: r.color, background: r.bg } : {}}>
              <span className={styles.rolePreviewIcon}>{r.icon}</span>
              <div>
                <div className={styles.rolePreviewLabel} style={{ color: role === r.value ? r.color : 'rgba(255,255,255,0.8)' }}>{r.label}</div>
                <div className={styles.rolePreviewDesc}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.right}>
        <div className={styles.card}>

          {/* Step indicator */}
          <div className={styles.steps}>
            <Step num={1} label="Choose Role" active={step === 1} done={step > 1} />
            <div className={styles.stepLine} />
            <Step num={2} label="Create Account" active={step === 2} done={success} />
          </div>

          {/* Success state */}
          {success ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}>✅</div>
              <h3>Account created!</h3>
              <p>Redirecting to login…</p>
            </div>
          ) : step === 1 ? (
            /* ── Step 1: Pick role ── */
            <div>
              <div className={styles.cardHeader}>
                <h2>What's your role?</h2>
                <p>Choose the role that matches what you'll do on the team.</p>
              </div>
              <div className={styles.roleCards}>
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    className={styles.roleCard}
                    onClick={() => handleRoleSelect(r.value)}
                    style={{ '--role-color': r.color, '--role-bg': r.bg }}
                  >
                    <div className={styles.roleCardIcon} style={{ background: r.bg }}>{r.icon}</div>
                    <div className={styles.roleCardInfo}>
                      <div className={styles.roleCardLabel}>{r.label}</div>
                      <div className={styles.roleCardDesc}>{r.desc}</div>
                    </div>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className={styles.roleCardArrow}>
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                ))}
              </div>
              <div className={styles.loginLink}>
                Already have an account? <Link to="/login">Sign in</Link>
              </div>
            </div>
          ) : (
            /* ── Step 2: Fill form ── */
            <form onSubmit={handleSubmit}>
              <div className={styles.cardHeader}>
                <button type="button" className={styles.backBtn} onClick={() => { setStep(1); setError(''); }}>
                  ← Back
                </button>
                <div className={styles.selectedRole} style={{ background: selectedRole?.bg, color: selectedRole?.color }}>
                  {selectedRole?.icon} {selectedRole?.label}
                </div>
                <h2>Create your account</h2>
                <p>You're signing up as a <strong>{selectedRole?.label}</strong>.</p>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.field}>
                <label>Username</label>
                <input
                  type="text"
                  placeholder="e.g. john_dev"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  autoFocus
                  maxLength={30}
                />
                <span className={styles.hint}>This will be your login ID and your developer/tester ID in bugs.</span>
              </div>

              <div className={styles.field}>
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className={styles.strengthBar}>
                  <div
                    className={styles.strengthFill}
                    style={{
                      width: `${Math.min(100, password.length * 10)}%`,
                      background: password.length < 6 ? '#ef4444' : password.length < 10 ? '#f59e0b' : '#10b981',
                    }}
                  />
                  <span className={styles.strengthLabel}>
                    {password.length < 6 ? 'Too short' : password.length < 10 ? 'Good' : 'Strong'}
                  </span>
                </div>
              )}

              <button type="submit" className={styles.submitBtn} disabled={loading}
                style={{ background: selectedRole?.color }}>
                {loading
                  ? <><span className={styles.spinner} /> Creating account…</>
                  : `Create ${selectedRole?.label} Account`}
              </button>

              <div className={styles.loginLink}>
                Already have an account? <Link to="/login">Sign in</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ num, label, active, done }) {
  return (
    <div className={`${styles.step} ${active ? styles.stepActive : ''} ${done ? styles.stepDone : ''}`}>
      <div className={styles.stepCircle}>{done ? '✓' : num}</div>
      <span className={styles.stepLabel}>{label}</span>
    </div>
  );
}
