// src/pages/BugsPage.jsx
// URL param ?q= is the SINGLE source of truth for search.
// Header search + inline search both read/write the same URL param — no desync.
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllDefects } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import BugCard from '../components/defects/BugCard';
import BugDetailModal from '../components/defects/BugDetailModal';
import styles from './BugsPage.module.css';

const PRIORITY_OPTIONS = ['All', 'P1', 'P2', 'P3'];
const SEVERITY_OPTIONS = ['All', 'Blocking', 'Critical', 'Major', 'Minor', 'Low'];
const STATUS_OPTIONS   = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];

export default function BugsPage() {
  const { permissions } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [defects,    setDefects]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selectedBug, setSelectedBug] = useState(null);

  // Filters — local state (don't need to be in URL)
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus,   setFilterStatus]   = useState('All');

  // Search — READ directly from URL (single source of truth)
  const searchQuery = searchParams.get('q') || '';

  const fetchDefects = useCallback(() => {
    setLoading(true);
    getAllDefects()
      .then(res => setDefects(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDefects([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDefects(); }, [fetchDefects]);

  // Update search in URL (both header and inline use this)
  const handleSearchChange = (val) => {
    const newParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      newParams.set('q', val);
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams, { replace: true });
  };

  // Filtering — purely computed, no extra state
  const activeSearch = searchQuery.toLowerCase();
  const filtered = defects.filter(d => {
    if (filterPriority !== 'All' && d.priority !== filterPriority) return false;
    if (filterSeverity !== 'All' && d.severity !== filterSeverity) return false;
    if (filterStatus   !== 'All' && d.status   !== filterStatus)   return false;
    if (activeSearch) {
      return (
        d.title?.toLowerCase().includes(activeSearch) ||
        d.defectdetails?.toLowerCase().includes(activeSearch) ||
        d.assignedtodeveloperid?.toLowerCase().includes(activeSearch) ||
        d.reportedbytesterid?.toLowerCase().includes(activeSearch) ||
        d.severity?.toLowerCase().includes(activeSearch) ||
        d.priority?.toLowerCase().includes(activeSearch) ||
        d.status?.toLowerCase().includes(activeSearch) ||
        String(d.id).includes(activeSearch) ||
        String(d.projectcode || '').includes(activeSearch)
      );
    }
    return true;
  });

  const hasFilters = filterPriority !== 'All' || filterSeverity !== 'All' || filterStatus !== 'All' || searchQuery;

  const clearAll = () => {
    setFilterPriority('All');
    setFilterSeverity('All');
    setFilterStatus('All');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('q');
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className={styles.page}>
      <Header title="Bug Reports" subtitle="Dashboard > Project > Bug Report" />

      <div className={styles.content}>
        {/* ── Toolbar ── */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <FilterSelect label="Priority" value={filterPriority} options={PRIORITY_OPTIONS} onChange={setFilterPriority} />
            <FilterSelect label="Severity" value={filterSeverity} options={SEVERITY_OPTIONS} onChange={setFilterSeverity} />
            <FilterSelect label="Status"   value={filterStatus}   options={STATUS_OPTIONS}   onChange={setFilterStatus} />
          </div>

          <div className={styles.toolbarRight}>
            {/* Inline search — reads/writes same URL param as header search */}
            <div className={styles.searchBox}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className={styles.sIcon}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search title, ID, developer, status…"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') handleSearchChange(''); }}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button className={styles.clearSearch} onClick={() => handleSearchChange('')}>✕</button>
              )}
            </div>

            {hasFilters && (
              <button className={styles.clearBtn} onClick={clearAll}>✕ Clear all</button>
            )}

            {permissions?.canCreate && (
              <button className={styles.actionBtn} onClick={() => navigate('/create')}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Report Bug
              </button>
            )}
            {permissions?.canViewKanban && (
              <button className={styles.kanbanBtn} onClick={() => navigate('/kanban')}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>
                Kanban
              </button>
            )}
          </div>
        </div>

        {/* Result count */}
        {!loading && (
          <div className={styles.meta}>
            {searchQuery && <span className={styles.searchingFor}>Results for "<strong>{searchQuery}</strong>" — </span>}
            <span><strong>{filtered.length}</strong> of <strong>{defects.length}</strong> bugs</span>
            {hasFilters && <span className={styles.filteredTag}>filtered</span>}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /><p>Loading bug reports…</p></div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🐛</div>
            <h3>{hasFilters ? 'No bugs match your search' : 'No bug reports yet'}</h3>
            <p>{hasFilters ? `No results for "${searchQuery || 'current filters'}". Try different terms.`
                           : permissions?.canCreate ? 'Start by reporting a bug!' : 'Bug reports will appear here.'}</p>
            {hasFilters && <button className={styles.clearBtn} onClick={clearAll} style={{marginTop:12}}>✕ Clear filters</button>}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((bug, i) => (
              <div key={bug.id} className="animate-fade" style={{animationDelay:`${i*0.025}s`}}>
                <BugCard bug={bug} onClick={setSelectedBug} />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedBug && (
        <BugDetailModal
          bug={selectedBug}
          onClose={() => setSelectedBug(null)}
          onUpdated={() => { fetchDefects(); setSelectedBug(null); }}
        />
      )}
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={styles.filterSelect}>
      {options.map(o => <option key={o} value={o}>{o === 'All' ? `${label}: All` : o}</option>)}
    </select>
  );
}
