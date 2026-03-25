// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useAuth, ROLE_PERMISSIONS } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

const Icons = {
  dashboard: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  bugs:      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M8 2l1.5 1.5M16 2l-1.5 1.5M12 6a5 5 0 015 5v3a5 5 0 01-10 0v-3a5 5 0 015-5z"/><path d="M7 10H3M17 10h4M7 16H4M17 16h3"/></svg>,
  kanban:    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>,
  report:    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path d="M3 3v18h18"/><path d="M7 16l4-5 4 3 4-6"/></svg>,
  create:    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>,
  logout:    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
};

// All possible nav items with role restrictions
const ALL_NAV = [
  { key: 'dashboard', path: '/dashboard', label: 'Dashboard',      icon: Icons.dashboard },
  { key: 'bugs',      path: '/bugs',      label: 'Bug Reports',    icon: Icons.bugs },
  { key: 'create',    path: '/create',    label: 'Report Bug',     icon: Icons.create },
  { key: 'kanban',    path: '/kanban',    label: 'Kanban Board',   icon: Icons.kanban },
  { key: 'report',    path: '/report',    label: 'Project Report', icon: Icons.report },
];

const roleColors = {
  tester:       { bg: '#f5f3ff', color: '#7c3aed', dot: '#8b5cf6' },
  developer:    { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6' },
  productowner: { bg: '#ecfdf5', color: '#065f46', dot: '#10b981' },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const role = user?.role || 'productowner';
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.productowner;
  const navItems = ALL_NAV.filter(n => permissions.navItems.includes(n.key));
  const rc = roleColors[role] || roleColors.productowner;

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIconWrap}>
          <span className={styles.logoLetter}>B</span>
        </div>
        <span className={styles.logoText}>BugTrackr</span>
      </div>

      {/* Role badge */}
      <div className={styles.roleBadge} style={{ background: rc.bg }}>
        <span className={styles.roleDot} style={{ background: rc.dot }} />
        <span className={styles.roleLabel} style={{ color: rc.color }}>
          {permissions.label} View
        </span>
      </div>

      {/* Nav — only items this role can access */}
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Permissions quick-view */}
      <div className={styles.permBox}>
        <div className={styles.permTitle}>Your permissions</div>
        <PermRow icon="🐛" label="Create bugs"    allowed={permissions.canCreate} />
        <PermRow icon="✅" label="Resolve bugs"   allowed={permissions.canResolve} />
        <PermRow icon="📊" label="View reports"   allowed={permissions.canReport} />
        <PermRow icon="☰"  label="Kanban board"   allowed={permissions.canViewKanban} />
      </div>

      {/* User */}
      <div className={styles.userSection}>
        <div className={styles.avatar} style={{ background: rc.dot }}>
          {user?.userName?.charAt(0).toUpperCase()}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user?.userName}</div>
          <div className={styles.userRole}>{permissions.label}</div>
        </div>
        <button onClick={logout} className={styles.logoutBtn} title="Logout">
          {Icons.logout}
        </button>
      </div>
    </aside>
  );
}

function PermRow({ icon, label, allowed }) {
  return (
    <div className={styles.permRow}>
      <span className={styles.permIcon}>{icon}</span>
      <span className={styles.permLabel}>{label}</span>
      <span className={allowed ? styles.permYes : styles.permNo}>
        {allowed ? '✓' : '✕'}
      </span>
    </div>
  );
}
