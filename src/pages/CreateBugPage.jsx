// src/pages/CreateBugPage.jsx — with live developer dropdown
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDefect, getUsersByRole } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import styles from './CreateBugPage.module.css';

const today = new Date().toISOString().split('T')[0];

const defaultForm = {
  title: '', defectdetails: '', stepstoreproduce: '',
  expectedbehavior: '', actualbehavior: '',
  priority: 'P2', severity: 'Major', status: 'Open',
  reportedbytesterid: '', assignedtodeveloperid: '',
  projectcode: '', detectedon: today, resolutions: [],
};

export default function CreateBugPage() {
  const { user, permissions } = useAuth();
  const navigate = useNavigate();

  const [form,       setForm]       = useState({ ...defaultForm, reportedbytesterid: user?.userName || '' });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  // Developer list fetched from backend
  const [developers, setDevelopers] = useState([]);
  const [devLoading, setDevLoading] = useState(true);
  const [noDev,      setNoDev]      = useState(false);

  // Fetch developers on mount
  useEffect(() => {
    setDevLoading(true);
    getUsersByRole('developer')
      .then(res => {
        const devs = Array.isArray(res.data) ? res.data : [];
        setDevelopers(devs);
        setNoDev(devs.length === 0);
        // Auto-select first developer if only one
        if (devs.length === 1) {
          setForm(p => ({ ...p, assignedtodeveloperid: devs[0].userName }));
        }
      })
      .catch(() => { setDevelopers([]); setNoDev(true); })
      .finally(() => setDevLoading(false));
  }, []);

  if (!permissions?.canCreate) {
    return (
      <div className={styles.page}>
        <Header title="Report Bug" />
        <div className={styles.denied}>
          <span style={{ fontSize: 36 }}>🚫</span>
          <h3>Access Denied</h3>
          <p>Only testers can create bug reports.</p>
          <button className={styles.backBtn} onClick={() => navigate('/bugs')}>← Back to Bugs</button>
        </div>
      </div>
    );
  }

  const set = (field, value) => { setForm(p => ({ ...p, [field]: value })); setError(''); };

  const validate = () => {
    if (!form.title.trim())              return 'Bug title is required.';
    if (!form.defectdetails.trim())      return 'Description is required.';
    if (!form.stepstoreproduce.trim())   return 'Steps to reproduce are required.';
    if (!form.reportedbytesterid.trim()) return 'Tester ID is required.';
    if (!form.projectcode)               return 'Project code is required.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const payload = {
        ...form,
        projectcode: parseInt(form.projectcode, 10),
        assignedtodeveloperid: form.assignedtodeveloperid || null,
        expectedresolution: null,
      };
      const res = await createDefect(payload);
      if (res.data?.error) { setError(res.data.error); return; }
      setSuccess('✅ Bug reported successfully!');
      setTimeout(() => navigate('/bugs'), 1500);
    } catch (e) {
      const msg = e.response?.data?.error || e.response?.data || 'Failed to create. Try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Header title="Report New Bug" subtitle="Dashboard > Report Bug" />

      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.pageIcon}>🐛</div>
            <div>
              <h2 className={styles.pageTitle}>Report a Bug</h2>
              <p className={styles.pageSub}>All fields marked <span className={styles.req}>*</span> are required</p>
            </div>
          </div>
          <div className={styles.pageHeaderRight}>
            <button className={styles.cancelBtn} onClick={() => navigate('/bugs')}>Cancel</button>
            <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
              {loading ? <><span className={styles.spinner} /> Submitting…</> : '🐛 Submit Bug'}
            </button>
          </div>
        </div>

        {error   && <div className={styles.errorBar}>⚠️ {error}</div>}
        {success && <div className={styles.successBar}>{success}</div>}

        {/* No developer banner */}
        {noDev && !devLoading && (
          <div className={styles.noDevBanner}>
            <span>⚠️</span>
            <div>
              <strong>No developers registered yet.</strong> You can still create the bug — assign it to a developer later once they register.
            </div>
          </div>
        )}

        <div className={styles.sections}>
          {/* ── Section 1: Bug Details ── */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionNum}>01</span>
              <span>Bug Details</span>
            </div>
            <div className={styles.sectionBody}>
              <Field label="Bug Title" req>
                <input className={styles.input} placeholder="e.g. Login page crashes on submit" value={form.title} onChange={e => set('title', e.target.value)} />
              </Field>
              <Field label="Description" req>
                <textarea className={styles.textarea} placeholder="What is the bug? What were you doing when it happened?" value={form.defectdetails} onChange={e => set('defectdetails', e.target.value)} rows={4} />
              </Field>
              <Field label="Steps to Reproduce" req hint="Only first 10 words saved (backend rule)">
                <textarea className={styles.textarea} placeholder="1. Open app&#10;2. Click Login&#10;3. Enter valid creds&#10;4. Click Submit → crashes" value={form.stepstoreproduce} onChange={e => set('stepstoreproduce', e.target.value)} rows={4} />
              </Field>
              <Field label="Expected Behavior" hint="What should have happened?">
                <textarea className={styles.textarea} placeholder="e.g. User should be redirected to dashboard after login" value={form.expectedbehavior} onChange={e => set('expectedbehavior', e.target.value)} rows={2} />
              </Field>
              <Field label="Actual Behavior" hint="What actually happened?">
                <textarea className={styles.textarea} placeholder="e.g. App crashes with NullPointerException" value={form.actualbehavior} onChange={e => set('actualbehavior', e.target.value)} rows={2} />
              </Field>
            </div>
          </div>

          {/* ── Section 2: Classification ── */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionNum}>02</span>
              <span>Classification</span>
            </div>
            <div className={styles.sectionBody}>
              <Field label="Priority" req>
                <div className={styles.radioGroup}>
                  {[
                    { val:'P1', label:'P1', sub:'Critical', color:'#ef4444', bg:'#fef2f2' },
                    { val:'P2', label:'P2', sub:'Medium',   color:'#f59e0b', bg:'#fffbeb' },
                    { val:'P3', label:'P3', sub:'Low',      color:'#10b981', bg:'#f0fdf4' },
                  ].map(p => (
                    <label key={p.val}
                      className={`${styles.radioCard} ${form.priority === p.val ? styles.radioSelected : ''}`}
                      style={form.priority === p.val ? { borderColor: p.color, background: p.bg } : {}}>
                      <input type="radio" name="priority" value={p.val} checked={form.priority===p.val} onChange={() => set('priority',p.val)} className={styles.radioInput} />
                      <span className={styles.radioLabel} style={{ color: form.priority===p.val ? p.color : 'var(--text-secondary)' }}>{p.label}</span>
                      <span className={styles.radioSub}>{p.sub}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Severity" req>
                <div className={styles.severityGroup}>
                  {['Blocking','Critical','Major','Minor','Low'].map(s => (
                    <label key={s} className={`${styles.sevChip} ${form.severity===s ? styles.sevSelected : ''}`}>
                      <input type="radio" name="severity" value={s} checked={form.severity===s} onChange={() => set('severity',s)} className={styles.radioInput} />
                      {s}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Initial Status">
                <select className={styles.select} value={form.status} onChange={e => set('status', e.target.value)}>
                  <option>Open</option>
                  <option>In Progress</option>
                </select>
              </Field>
              <div className={styles.infoBox}>
                💡 <strong>Expected resolution date</strong> is auto-calculated by backend based on severity + priority (e.g. Blocking + P1 = 2 days).
              </div>
            </div>
          </div>

          {/* ── Section 3: Assignment ── */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionNum}>03</span>
              <span>Assignment</span>
            </div>
            <div className={styles.sectionBody}>
              <Field label="Project Code" req>
                <input className={styles.input} type="number" placeholder="e.g. 1001" value={form.projectcode} onChange={e => set('projectcode', e.target.value)} />
              </Field>
              <Field label="Detected On" req>
                <input className={styles.input} type="date" value={form.detectedon} onChange={e => set('detectedon', e.target.value)} />
              </Field>
              <Field label="Your Tester ID" req>
                <input className={styles.input} placeholder="Your username" value={form.reportedbytesterid} onChange={e => set('reportedbytesterid', e.target.value)} />
              </Field>

              {/* ── LIVE DEVELOPER DROPDOWN ── */}
              <Field label="Assign to Developer">
                {devLoading ? (
                  <div className={styles.devLoading}>
                    <span className={styles.devSpinner} /> Fetching developers…
                  </div>
                ) : developers.length === 0 ? (
                  <div className={styles.noDevInput}>
                    <input
                      className={styles.input}
                      placeholder="No developers yet — type ID manually or leave blank"
                      value={form.assignedtodeveloperid}
                      onChange={e => set('assignedtodeveloperid', e.target.value)}
                    />
                    <div className={styles.noDevNote}>
                      ℹ️ No developers found in the system. You can assign later.
                    </div>
                  </div>
                ) : (
                  <div className={styles.devPickerWrap}>
                    <select
                      className={styles.select}
                      value={form.assignedtodeveloperid}
                      onChange={e => set('assignedtodeveloperid', e.target.value)}
                    >
                      <option value="">— Select a developer —</option>
                      {developers.map(dev => (
                        <option key={dev.id} value={dev.userName}>
                          {dev.userName}
                        </option>
                      ))}
                    </select>
                    <div className={styles.devCount}>
                      {developers.length} developer{developers.length !== 1 ? 's' : ''} available
                    </div>
                    {/* Show developer cards */}
                    <div className={styles.devCards}>
                      {developers.map(dev => (
                        <button
                          key={dev.id}
                          type="button"
                          className={`${styles.devCard} ${form.assignedtodeveloperid === dev.userName ? styles.devCardSelected : ''}`}
                          onClick={() => set('assignedtodeveloperid', dev.userName)}
                        >
                          <div className={styles.devAvatar}>{dev.userName.charAt(0).toUpperCase()}</div>
                          <span className={styles.devName}>{dev.userName}</span>
                          {form.assignedtodeveloperid === dev.userName && <span className={styles.devCheck}>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Field>

              <div className={styles.limitNote}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Max 5 bugs per developer per day (enforced by backend)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, req, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}{req && <span className={styles.req}> *</span>}</label>
      {children}
      {hint && <span className={styles.fieldHint}>{hint}</span>}
    </div>
  );
}
