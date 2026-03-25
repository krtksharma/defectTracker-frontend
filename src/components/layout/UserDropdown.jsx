// src/components/layout/UserDropdown.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_PERMISSIONS } from '../../context/AuthContext';
import styles from './UserDropdown.module.css';

const roleColor = {
  tester:       { bg: '#f5f3ff', color: '#7c3aed', dot: '#8b5cf6' },
  developer:    { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  productowner: { bg: '#ecfdf5', color: '#065f46', dot: '#10b981' },
};

export default function UserDropdown() {
  const { user, logout, permissions } = useAuth();
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);
  const nav  = useNavigate();
  const role = user?.role || 'productowner';
  const rc   = roleColor[role] || roleColor.productowner;

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => { logout(); nav('/login'); };

  const menuItems = [
    { icon: '⊞', label: 'Dashboard', path: '/dashboard' },
    { icon: '🐛', label: 'Bug Reports', path: '/bugs' },
    ...(permissions?.canCreate    ? [{ icon: '➕', label: 'Report Bug',      path: '/create'  }] : []),
    ...(permissions?.canViewKanban? [{ icon: '☰',  label: 'Kanban Board',    path: '/kanban'  }] : []),
    ...(permissions?.canReport    ? [{ icon: '📊', label: 'Project Report',  path: '/report'  }] : []),
  ];

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.avatar} onClick={() => setOpen(o => !o)} title={`${user?.userName} (${user?.role})`}>
        {user?.userName?.charAt(0).toUpperCase()}
        <span className={styles.avatarDot} style={{ background: rc.dot }} />
      </button>

      {open && (
        <div className={styles.dropdown}>
          {/* User info */}
          <div className={styles.userInfo}>
            <div className={styles.bigAvatar} style={{ background: rc.dot }}>
              {user?.userName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className={styles.userName}>{user?.userName}</div>
              <span className={styles.rolePill} style={{ background: rc.bg, color: rc.color }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:rc.dot, display:'inline-block', marginRight:5 }}/>
                {permissions?.label}
              </span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Nav links */}
          {menuItems.map(item => (
            <button key={item.path} className={styles.menuItem}
              onClick={() => { nav(item.path); setOpen(false); }}>
              <span className={styles.menuIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className={styles.divider} />

          {/* Logout */}
          <button className={styles.logoutItem} onClick={handleLogout}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
