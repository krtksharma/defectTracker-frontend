// src/pages/DashboardPage.jsx — role-specific, developer sees only their bugs
import { useEffect, useState } from 'react';
import { getAllDefects, getDefectsByDeveloper } from '../services/api';
import { useAuth, ROLE_PERMISSIONS } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import BugDetailModal from '../components/defects/BugDetailModal';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { user, permissions } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'productowner';

  const [defects,    setDefects]    = useState([]);
  const [myBugs,     setMyBugs]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selectedBug, setSelectedBug] = useState(null);

  const fetchData = () => {
    setLoading(true);
    const allReq = getAllDefects();
    const myReq  = role === 'developer'
      ? getDefectsByDeveloper(user.userName)
      : Promise.resolve({ data: [] });

    Promise.all([allReq, myReq])
      .then(([allRes, myRes]) => {
        setDefects(Array.isArray(allRes.data) ? allRes.data : []);
        setMyBugs(Array.isArray(myRes.data) ? myRes.data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // Stats — global
  const total      = defects.length;
  const open       = defects.filter(d => d.status === 'Open').length;
  const inProgress = defects.filter(d => d.status === 'In Progress').length;
  const resolved   = defects.filter(d => d.status === 'Resolved').length;
  const closed     = defects.filter(d => d.status === 'Closed').length;
  const p1Bugs     = defects.filter(d => d.priority === 'P1').length;
  const blocking   = defects.filter(d => d.severity === 'Blocking' || d.severity === 'Critical').length;

  // My bugs stats (developer)
  const myOpen       = myBugs.filter(d => d.status === 'Open').length;
  const myInProgress = myBugs.filter(d => d.status === 'In Progress').length;
  const myResolved   = myBugs.filter(d => d.status === 'Resolved' || d.status === 'Closed').length;
  const myP1         = myBugs.filter(d => d.priority === 'P1').length;

  // Tester's reported bugs
  const myReported = role === 'tester'
    ? defects.filter(d => d.reportedbytesterid === user?.userName)
    : [];

  const recent = [...defects].slice(0, 5);

  const colorMap = {
    blue:   { bg:'#eff6ff', val:'#1d4ed8' },
    red:    { bg:'#fef2f2', val:'#dc2626' },
    orange: { bg:'#fffbeb', val:'#d97706' },
    green:  { bg:'#f0fdf4', val:'#059669' },
    purple: { bg:'#f5f3ff', val:'#7c3aed' },
  };

  const roleConfig = {
    tester: {
      title: `Ready to report, ${user?.userName}?`,
      sub: 'You can create new bug reports and track their progress.',
      stats: [
        { icon:'📝', label:'Your Reports',  value:myReported.length, color:'purple', path:'/bugs' },
        { icon:'🔴', label:'Open Bugs',     value:open,              color:'red',    path:'/bugs' },
        { icon:'🐛', label:'Total Bugs',    value:total,             color:'blue',   path:'/bugs' },
        { icon:'✅', label:'Resolved',      value:resolved,          color:'green',  path:'/bugs' },
      ],
      actions: [
        { icon:'🐛', label:'Report New Bug', path:'/create', primary:true },
        { icon:'📋', label:'View All Bugs',  path:'/bugs',   primary:false },
      ],
    },
    developer: {
      title: `Your bugs, ${user?.userName}`,
      sub: 'Bugs assigned to you — track and resolve them.',
      stats: [
        { icon:'📌', label:'Assigned to You', value:myBugs.length,  color:'blue',   path:'/kanban' },
        { icon:'🔴', label:'Open (Yours)',     value:myOpen,         color:'red',    path:'/kanban' },
        { icon:'🟡', label:'In Progress',      value:myInProgress,   color:'orange', path:'/kanban' },
        { icon:'✅', label:'You Resolved',     value:myResolved,     color:'green',  path:'/kanban' },
        { icon:'⚡', label:'P1 on You',        value:myP1,           color:'red',    path:'/kanban' },
        { icon:'🌍', label:'All Bugs Total',   value:total,          color:'blue',   path:'/bugs' },
      ],
      actions: [
        { icon:'☰', label:'Open Kanban',   path:'/kanban', primary:true },
        { icon:'📋', label:'All Bug Reports', path:'/bugs', primary:false },
      ],
    },
    productowner: {
      title: `Project overview, ${user?.userName}`,
      sub: 'Read-only visibility across all bugs and projects.',
      stats: [
        { icon:'🐛', label:'Total Bugs',   value:total,    color:'blue',   path:'/bugs' },
        { icon:'🔴', label:'Open',         value:open,     color:'red',    path:'/bugs' },
        { icon:'🟡', label:'In Progress',  value:inProgress, color:'orange', path:'/bugs' },
        { icon:'✅', label:'Resolved',     value:resolved, color:'green',  path:'/report' },
        { icon:'⚡', label:'P1 Critical',  value:p1Bugs,   color:'red',    path:'/bugs' },
        { icon:'🚨', label:'Blocking',     value:blocking, color:'purple', path:'/report' },
      ],
      actions: [
        { icon:'📊', label:'Generate Report', path:'/report', primary:true },
        { icon:'📋', label:'View All Bugs',   path:'/bugs',   primary:false },
      ],
    },
  };

  const cfg = roleConfig[role] || roleConfig.productowner;

  return (
    <div className={styles.page}>
      <Header title="Dashboard" subtitle="Dashboard > Overview" />

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}><div className={styles.spinner}/><p>Loading…</p></div>
        ) : (
          <>
            {/* Welcome banner */}
            <div className={styles.welcomeBanner}>
              <div className={styles.welcomeLeft}>
                <h2 className={styles.welcomeTitle}>{cfg.title}</h2>
                <p className={styles.welcomeSub}>{cfg.sub}</p>
              </div>
              <div className={styles.welcomeActions}>
                {cfg.actions.map(a => (
                  <button key={a.path}
                    className={a.primary ? styles.primaryBtn : styles.secondaryBtn}
                    onClick={() => navigate(a.path)}>
                    <span>{a.icon}</span> {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
              {cfg.stats.map((s, i) => {
                const c = colorMap[s.color] || colorMap.blue;
                return (
                  <div key={i} className={styles.statCard}
                    onClick={() => navigate(s.path)}
                    style={{ animationDelay:`${i*0.05}s` }}>
                    <div className={styles.statIcon} style={{ background: c.bg }}>{s.icon}</div>
                    <div className={styles.statInfo}>
                      <div className={styles.statVal} style={{ color: c.val }}>{s.value}</div>
                      <div className={styles.statLabel}>{s.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.bottomRow}>
              {/* Developer: show their assigned bugs inline */}
              {role === 'developer' && myBugs.length > 0 ? (
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>🐛 Bugs Assigned to You</h3>
                    <button className={styles.linkBtn} onClick={() => navigate('/kanban')}>Kanban →</button>
                  </div>
                  <div className={styles.myBugsList}>
                    {myBugs.slice(0, 8).map(bug => (
                      <MyBugRow key={bug.id} bug={bug} onClick={() => setSelectedBug(bug)} />
                    ))}
                    {myBugs.length > 8 && (
                      <div className={styles.moreRow}>
                        +{myBugs.length - 8} more bugs — <button className={styles.linkBtn} onClick={() => navigate('/kanban')}>view all on Kanban</button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>Recent Reports</h3>
                    <button className={styles.linkBtn} onClick={() => navigate('/bugs')}>View all →</button>
                  </div>
                  {recent.length === 0
                    ? <p className={styles.empty}>No bugs yet.</p>
                    : recent.map(b => <RecentRow key={b.id} bug={b} onClick={() => navigate('/bugs')} />)
                  }
                </div>
              )}

              {/* Charts */}
              <div className={styles.chartsCol}>
                <div className={styles.card}>
                  <h3 className={styles.cardTitle} style={{ marginBottom:14 }}>Priority Breakdown</h3>
                  {[
                    { label:'P1', count:p1Bugs,                                          color:'#ef4444' },
                    { label:'P2', count:defects.filter(d=>d.priority==='P2').length,     color:'#f59e0b' },
                    { label:'P3', count:defects.filter(d=>d.priority==='P3').length,     color:'#22c55e' },
                  ].map(r => (
                    <div key={r.label} className={styles.barRow}>
                      <span className={styles.barLabel}>{r.label}</span>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{
                          width: total ? `${Math.round(r.count/total*100)}%` : '0%',
                          background: r.color
                        }}/>
                      </div>
                      <span className={styles.barCount}>{r.count}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle} style={{ marginBottom:12 }}>Status Overview</h3>
                  {[
                    { label:'Open',        count:open,       color:'#3b82f6' },
                    { label:'In Progress', count:inProgress, color:'#f59e0b' },
                    { label:'Resolved',    count:resolved,   color:'#10b981' },
                    { label:'Closed',      count:closed,     color:'#6b7280' },
                  ].map(s => (
                    <div key={s.label} className={styles.statusRow} style={{ borderLeftColor:s.color }}>
                      <span className={styles.statusLabel}>{s.label}</span>
                      <span className={styles.statusCount} style={{ color:s.color }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedBug && (
        <BugDetailModal
          bug={selectedBug}
          onClose={() => setSelectedBug(null)}
          onUpdated={() => { fetchData(); setSelectedBug(null); }}
        />
      )}
    </div>
  );
}

function MyBugRow({ bug, onClick }) {
  const stColors = { Open:'#3b82f6','In Progress':'#a855f7',Resolved:'#10b981',Closed:'#6b7280' };
  const pColors  = { P1:'#ef4444', P2:'#f59e0b', P3:'#22c55e' };
  return (
    <div className={styles.myBugRow} onClick={onClick}>
      <div className={styles.myBugPriority} style={{ background: `${pColors[bug.priority]||'#ccc'}20`, color: pColors[bug.priority]||'#ccc' }}>
        {bug.priority}
      </div>
      <div className={styles.myBugInfo}>
        <div className={styles.myBugTitle}>{bug.title}</div>
        <div className={styles.myBugMeta}>#{bug.id} · {bug.severity} · {bug.detectedon}</div>
      </div>
      <span className={styles.myBugStatus} style={{ background:`${stColors[bug.status]||'#888'}15`, color:stColors[bug.status]||'#888' }}>
        {bug.status}
      </span>
    </div>
  );
}

function RecentRow({ bug, onClick }) {
  const pColors = { P1:'#ef4444', P2:'#f59e0b', P3:'#22c55e' };
  return (
    <div className={styles.recentRow} onClick={onClick}>
      <div className={styles.recentDot} style={{ background: pColors[bug.priority]||'#ccc' }}/>
      <div className={styles.recentInfo}>
        <div className={styles.recentTitle}>{bug.title}</div>
        <div className={styles.recentMeta}>#{bug.id} · {bug.severity} · {bug.status}</div>
      </div>
      <span className={styles.recentDate}>{bug.detectedon}</span>
    </div>
  );
}
