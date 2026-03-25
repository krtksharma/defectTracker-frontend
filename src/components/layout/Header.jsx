// src/components/layout/Header.jsx
// The header search uses URL params as the single source of truth.
// BugsPage reads the same URL param — no desync possible.
import { useNavigate, useSearchParams } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import UserDropdown from './UserDropdown';
import styles from './Header.module.css';

export default function Header({ title, subtitle }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Single source of truth — read directly from URL
  const query = searchParams.get('q') || '';

  const setQuery = (val) => {
    if (val.trim()) {
      // Navigate to bugs with search param
      navigate(`/bugs?q=${encodeURIComponent(val)}`);
    } else {
      // Clear — remove param, stay on current page or go to /bugs
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('q');
      const paramStr = newParams.toString();
      navigate(window.location.pathname.includes('/bugs')
        ? `/bugs${paramStr ? '?' + paramStr : ''}`
        : window.location.pathname);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && (
          <nav className={styles.breadcrumb}>
            {subtitle.split(' > ').map((part, i, arr) => (
              <span key={i}>
                <span className={i === arr.length - 1 ? styles.breadActive : styles.breadItem}>{part}</span>
                {i < arr.length - 1 && <span className={styles.breadSep}> &gt; </span>}
              </span>
            ))}
          </nav>
        )}
      </div>

      <div className={styles.center}>
        <div className={styles.searchBox}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search bugs by title, ID, developer…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setQuery(''); }}
            className={styles.searchInput}
          />
          {query
            ? <button className={styles.clearBtn} onClick={() => setQuery('')}>✕</button>
            : <span className={styles.shortcut}>⌘+/</span>
          }
        </div>
      </div>

      <div className={styles.right}>
        <NotificationBell />
        <UserDropdown />
      </div>
    </header>
  );
}
