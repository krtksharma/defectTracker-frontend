// src/components/defects/BugCard.jsx
import styles from './BugCard.module.css';

// Map priority P1/P2/P3 to display labels like the screenshot (Medium/Low/High)
const priorityDisplay = {
  P1: { label: 'High',   bg: '#e8f4fd', color: '#3b82f6' },
  P2: { label: 'Medium', bg: '#fef3e2', color: '#d97706' },
  P3: { label: 'Low',    bg: '#fde8e8', color: '#e05252' },
};

// Fallback for raw labels if backend sends "High"/"Medium"/"Low" directly
const rawDisplay = {
  High:   { bg: '#e8f4fd', color: '#3b82f6' },
  Medium: { bg: '#fef3e2', color: '#d97706' },
  Low:    { bg: '#fde8e8', color: '#e05252' },
};

function getPriorityBadge(priority) {
  if (priorityDisplay[priority]) return priorityDisplay[priority];
  if (rawDisplay[priority]) return { label: priority, ...rawDisplay[priority] };
  return { label: priority || '—', bg: '#f3f4f6', color: '#6b7280' };
}

// Small colored avatar circle
function AvatarCircle({ name, color }) {
  const colors = ['#f87171','#fb923c','#facc15','#4ade80','#60a5fa','#a78bfa','#f472b6'];
  const bg = color || colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={styles.avatarCircle} style={{ background: bg }}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

export default function BugCard({ bug, onClick, dragging }) {
  const badge = getPriorityBadge(bug.priority);

  return (
    <div
      className={`${styles.card} ${dragging ? styles.dragging : ''}`}
      onClick={() => onClick && onClick(bug)}
    >
      {/* Priority Badge — top left, pill style */}
      <div className={styles.badgeRow}>
        <span
          className={styles.priorityBadge}
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      </div>

      {/* Title */}
      <h3 className={styles.title}>{bug.title}</h3>

      {/* Description */}
      <p className={styles.description}>{bug.defectdetails}</p>

      {/* Footer: date + avatars */}
      <div className={styles.footer}>
        <div className={styles.dateRow}>
          {/* Calendar SVG icon */}
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className={styles.calIcon}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span className={styles.dateText}>{bug.detectedon}</span>
        </div>

        <div className={styles.avatarRow}>
          <AvatarCircle name={bug.assignedtodeveloperid} />
          {bug.reportedbytesterid && bug.reportedbytesterid !== bug.assignedtodeveloperid && (
            <AvatarCircle name={bug.reportedbytesterid} color="#a78bfa" />
          )}
        </div>
      </div>
    </div>
  );
}
