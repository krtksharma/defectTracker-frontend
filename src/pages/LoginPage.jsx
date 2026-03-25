// src/pages/LoginPage.jsx
// Single landing page with toggle between Sign In / Sign Up tabs
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './LoginPage.module.css';

const ROLES = [
  { value: 'tester',       label: 'Tester',       icon: '🧪', desc: 'Report & track bugs. Assign bugs to developers.' },
  { value: 'developer',    label: 'Developer',     icon: '💻', desc: 'Resolve assigned bugs via the Kanban board.' },
  { value: 'productowner', label: 'Product Owner', icon: '📊', desc: 'View all bugs and generate project-level defect reports.' },
];

export default function LoginPage() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  // Login fields
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName,    setRegName]    = useState('');
  const [regPass,    setRegPass]    = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regRole,    setRegRole]    = useState('tester');

  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [regOk,   setRegOk]   = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const switchTab = (t) => { setTab(t); setError(''); setRegOk(false); };

  // ── LOGIN ────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userName.trim() || !password) return setError('Please enter username and password.');
    setError(''); setLoading(true);
    try {
      const res = await loginUser(userName.trim(), password);
      if (res.data?.userName) {
        login(res.data);
        navigate('/dashboard');
      } else {
        setError('Invalid username or password.');
      }
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const c = {
      developer: ['developer', 'developer123'],
      tester:    ['tester',    'tester123'],
      product:   ['product',   'product123'],
    };
    setUserName(c[role][0]); setPassword(c[role][1]); setError('');
  };

  // ── REGISTER ─────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!regName.trim())           return setError('Username is required.');
    if (regPass.length < 6)        return setError('Password must be at least 6 characters.');
    if (regPass !== regConfirm)    return setError('Passwords do not match.');
    setLoading(true);
    try {
      await registerUser(regName.trim(), regPass, regRole);
      setRegOk(true);
      setError('');
      setTimeout(() => {
        setTab('login');
        setUserName(regName.trim());
        setPassword('');
        setRegOk(false);
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data || 'Registration failed.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>

      {/* ── LEFT PANEL ─────────────────────────────── */}
      <div className={styles.left}>
        <div className={styles.logoWrap}>
          <div className={styles.logoBox}>B</div>
          <span className={styles.logoName}>BugTrackr</span>
        </div>

        <div className={styles.heroText}>
          <h1>Defect management<br/>made simple.</h1>
          <p>Track, assign, and resolve bugs faster with your whole team — testers, developers, and product owners.</p>
        </div>

        <div className={styles.featureList}>
          {[
            { icon: '🐛', text: 'Report & track defects end-to-end' },
            { icon: '☰', text: 'Drag & drop Kanban board' },
            { icon: '💬', text: 'Comments & discussion on bugs' },
            { icon: '📊', text: 'Project reports & analytics' },
            { icon: '🔐', text: 'Role-based access control' },
          ].map(f => (
            <div key={f.text} className={styles.featureItem}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Role cards on left — always visible */}
        <div className={styles.roleList}>
          {ROLES.map(r => (
            <div key={r.value} className={`${styles.roleListItem} ${tab === 'register' && regRole === r.value ? styles.roleListItemActive : ''}`}>
              <span className={styles.roleListIcon}>{r.icon}</span>
              <div>
                <div className={styles.roleListLabel}>{r.label}</div>
                <div className={styles.roleListDesc}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────── */}
      <div className={styles.right}>
        <div className={styles.card}>

          {/* Tab toggle */}
          <div className={styles.tabRow}>
            <button
              className={`${styles.tabBtn} ${tab === 'login' ? styles.tabActive : ''}`}
              onClick={() => switchTab('login')}
            >
              Sign In
            </button>
            <button
              className={`${styles.tabBtn} ${tab === 'register' ? styles.tabActive : ''}`}
              onClick={() => switchTab('register')}
            >
              Create Account
            </button>
          </div>

          {/* ── LOGIN FORM ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className={styles.formBody}>
              <div className={styles.cardHeader}>
                <h2>Welcome back 👋</h2>
                <p>Sign in to your BugTrackr account</p>
              </div>

              {/* Quick demo */}
              <div className={styles.demoRow}>
                <span className={styles.demoLabel}>Demo:</span>
                {['developer', 'tester', 'product'].map(r => (
                  <button key={r} type="button" className={styles.demoBtn} onClick={() => fillDemo(r)}>
                    {r === 'product' ? 'Owner' : r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>

              <div className={styles.field}>
                <label>Username</label>
                <input type="text" value={userName} onChange={e => { setUserName(e.target.value); setError(''); }} placeholder="Enter your username" autoFocus />
              </div>
              <div className={styles.field}>
                <label>Password</label>
                <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Enter your password" />
              </div>

              {error && <div className={styles.errorBox}>⚠️ {error}</div>}

              <button type="submit" className={styles.primaryBtn} disabled={loading}>
                {loading ? <><span className={styles.spinner} /> Signing in…</> : 'Sign In →'}
              </button>

              <div className={styles.switchHint}>
                New to BugTrackr?{' '}
                <button type="button" className={styles.switchLink} onClick={() => switchTab('register')}>
                  Create a free account →
                </button>
              </div>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className={styles.formBody}>
              {regOk ? (
                <div className={styles.successState}>
                  <div className={styles.successIcon}>🎉</div>
                  <h3>Account created!</h3>
                  <p>Switching to sign in…</p>
                </div>
              ) : (
                <>
                  <div className={styles.cardHeader}>
                    <h2>Create your account</h2>
                    <p>Choose your role and set your credentials</p>
                  </div>

                  {/* Role picker — inline in form */}
                  <div className={styles.fieldLabel}>Your Role</div>
                  <div className={styles.roleCards}>
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        className={`${styles.roleCard} ${regRole === r.value ? styles.roleCardActive : ''}`}
                        onClick={() => { setRegRole(r.value); setError(''); }}
                      >
                        <span className={styles.roleCardIcon}>{r.icon}</span>
                        <span className={styles.roleCardLabel}>{r.label}</span>
                        {regRole === r.value && <span className={styles.roleCheck}>✓</span>}
                      </button>
                    ))}
                  </div>

                  <div className={styles.field}>
                    <label>Username</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={e => { setRegName(e.target.value); setError(''); }}
                      placeholder="e.g. john_dev  (this is your login ID)"
                      maxLength={30}
                      autoFocus
                    />
                    <span className={styles.fieldHint}>This will also be your developer/tester ID on bugs.</span>
                  </div>

                  <div className={styles.twoCol}>
                    <div className={styles.field}>
                      <label>Password</label>
                      <input type="password" value={regPass} onChange={e => { setRegPass(e.target.value); setError(''); }} placeholder="Min. 6 chars" />
                    </div>
                    <div className={styles.field}>
                      <label>Confirm</label>
                      <input type="password" value={regConfirm} onChange={e => { setRegConfirm(e.target.value); setError(''); }} placeholder="Repeat password" />
                    </div>
                  </div>

                  {/* Password strength */}
                  {regPass.length > 0 && (
                    <div className={styles.strength}>
                      <div className={styles.strengthTrack}>
                        <div className={styles.strengthFill} style={{
                          width: `${Math.min(100, regPass.length * 10)}%`,
                          background: regPass.length < 6 ? '#ef4444' : regPass.length < 10 ? '#f59e0b' : '#10b981',
                        }} />
                      </div>
                      <span className={styles.strengthLabel} style={{ color: regPass.length < 6 ? '#ef4444' : regPass.length < 10 ? '#f59e0b' : '#10b981' }}>
                        {regPass.length < 6 ? 'Too short' : regPass.length < 10 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                  )}

                  {error && <div className={styles.errorBox}>⚠️ {error}</div>}

                  <button type="submit" className={styles.primaryBtn} disabled={loading}
                    style={{ background: regRole === 'tester' ? '#8b5cf6' : regRole === 'developer' ? '#3b82f6' : '#10b981' }}>
                    {loading
                      ? <><span className={styles.spinner} /> Creating…</>
                      : `Create ${ROLES.find(r=>r.value===regRole)?.label} Account`}
                  </button>

                  <div className={styles.switchHint}>
                    Already have an account?{' '}
                    <button type="button" className={styles.switchLink} onClick={() => switchTab('login')}>
                      Sign in →
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
