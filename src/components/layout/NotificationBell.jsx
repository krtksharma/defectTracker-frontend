// src/components/layout/NotificationBell.jsx
//
// HOW NOTIFICATIONS WORK (intentional design):
//
// 1. Backend returns ONLY unread notifications → clean list, no clutter
// 2. Opening the panel starts a 4s auto-dismiss timer per item
// 3. Clicking an item marks it read instantly → it fades out of the list
// 4. "Mark all read" → all fade out, panel shows empty state, badge clears
// 5. Polling (every 30s) only toasts IDs we haven't seen this session
// 6. Page refresh re-seeds seenIds from DB — no toast for existing notifications

import { useState, useEffect, useRef, useCallback } from 'react';
import { getNotifications, markNotifRead, markAllNotifsRead } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import styles from './NotificationBell.module.css';

const TYPE_ICON  = { BUG_ASSIGNED:'🐛', COMMENT_ADDED:'💬', STATUS_CHANGED:'🔄', BUG_RESOLVED:'✅' };
const TYPE_COLOR = { BUG_ASSIGNED:'#3b82f6', COMMENT_ADDED:'#8b5cf6', STATUS_CHANGED:'#f59e0b', BUG_RESOLVED:'#10b981' };

// How long before an open notification auto-dismisses (ms)
const AUTO_DISMISS_MS = 5000;

export default function NotificationBell() {
  const [open,       setOpen]       = useState(false);
  const [notifs,     setNotifs]     = useState([]);   // only unread from backend
  const [dismissing, setDismissing] = useState(new Set()); // IDs currently fading out
  const [loading,    setLoading]    = useState(false);

  const panelRef    = useRef(null);
  const { toast }   = useToast();
  const seenIds     = useRef(new Set()); // IDs seen this session → no repeated toasts
  const initialLoad = useRef(true);      // suppress toasts on first load
  const autoDismissTimers = useRef({});  // per-notification timers

  // ── Data fetching ────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    try {
      const res  = await getNotifications(); // backend now returns ONLY unread
      const data = Array.isArray(res.data) ? res.data : [];

      if (initialLoad.current) {
        // Seed all existing IDs — no toast for anything already in DB
        data.forEach(n => seenIds.current.add(n.id));
        initialLoad.current = false;
      } else {
        // Only toast brand-new IDs (arrived since last poll)
        const newOnes = data.filter(n => !seenIds.current.has(n.id));
        newOnes.forEach(n => {
          seenIds.current.add(n.id);
          toast(n.message, 'info', 4500);
        });
        data.forEach(n => seenIds.current.add(n.id));
      }

      setNotifs(data);
    } catch { /* backend not connected — silent */ }
  }, [toast]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Poll every 30s
  useEffect(() => {
    const t = setInterval(loadNotifications, 30000);
    return () => clearInterval(t);
  }, [loadNotifications]);

  // Close panel on outside click
  useEffect(() => {
    const h = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Auto-dismiss when panel is open ─────────────────────────────
  // When panel opens → start AUTO_DISMISS_MS timer for each notification
  // When panel closes → clear all pending timers
  useEffect(() => {
    if (open) {
      notifs.forEach(n => {
        if (!autoDismissTimers.current[n.id]) {
          autoDismissTimers.current[n.id] = setTimeout(() => {
            dismissOne(n.id);
          }, AUTO_DISMISS_MS);
        }
      });
    } else {
      // Panel closed — cancel all timers
      Object.values(autoDismissTimers.current).forEach(clearTimeout);
      autoDismissTimers.current = {};
    }
    return () => {
      Object.values(autoDismissTimers.current).forEach(clearTimeout);
    };
  }, [open, notifs]);

  // ── Dismiss a single notification (animate out → remove → mark read in DB) ──
  const dismissOne = useCallback(async (id) => {
    // 1. Start CSS fade-out animation
    setDismissing(prev => new Set([...prev, id]));

    // 2. Wait for animation, then remove from list
    setTimeout(() => {
      setNotifs(prev => prev.filter(n => n.id !== id));
      setDismissing(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 350);

    // 3. Mark read in backend (fire-and-forget)
    try { await markNotifRead(id); } catch {}

    // 4. Clean up timer
    if (autoDismissTimers.current[id]) {
      clearTimeout(autoDismissTimers.current[id]);
      delete autoDismissTimers.current[id];
    }
  }, []);

  // ── Mark all read ────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    // Start fade-out on all
    const allIds = notifs.map(n => n.id);
    setDismissing(new Set(allIds));

    // Remove all after animation
    setTimeout(() => {
      setNotifs([]);
      setDismissing(new Set());
    }, 350);

    // Mark read in backend
    try {
      await markAllNotifsRead();
      toast('All caught up! ✓', 'success', 2000);
    } catch {
      toast('Failed to mark notifications', 'error');
    }

    // Clear all timers
    Object.values(autoDismissTimers.current).forEach(clearTimeout);
    autoDismissTimers.current = {};
  };

  const timeAgo = (s) => {
    if (!s) return '';
    const d = Date.now() - new Date(s).getTime(), m = Math.floor(d / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  };

  const unreadCount = notifs.length; // backend already filters to unread only

  return (
    <div className={styles.wrap} ref={panelRef}>
      {/* Bell button */}
      <button
        className={`${styles.bell} ${open ? styles.bellOpen : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Notifications"
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.panelHeader}>
            <div className={styles.panelLeft}>
              <span className={styles.panelTitle}>Notifications</span>
              {unreadCount > 0 && (
                <span className={styles.countPill}>{unreadCount} unread</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                ✓ Clear all
              </button>
            )}
          </div>

          {/* Hint */}
          {unreadCount > 0 && (
            <div className={styles.hint}>
              Click a notification to dismiss it, or wait {AUTO_DISMISS_MS / 1000}s
            </div>
          )}

          {/* List */}
          <div className={styles.list}>
            {unreadCount === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🔔</div>
                <p className={styles.emptyTitle}>All caught up!</p>
                <p className={styles.emptyDesc}>No new notifications</p>
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  className={`${styles.item} ${dismissing.has(n.id) ? styles.itemDismissing : ''}`}
                  onClick={() => dismissOne(n.id)}
                  title="Click to dismiss"
                >
                  {/* Auto-dismiss progress bar */}
                  {open && (
                    <div
                      className={styles.autoDismissBar}
                      style={{ animationDuration: `${AUTO_DISMISS_MS}ms` }}
                    />
                  )}

                  <div
                    className={styles.itemIcon}
                    style={{
                      background: `${TYPE_COLOR[n.type] || '#6b7280'}18`,
                      color: TYPE_COLOR[n.type] || '#6b7280',
                    }}
                  >
                    {TYPE_ICON[n.type] || '🔔'}
                  </div>

                  <div className={styles.itemBody}>
                    <p className={styles.itemMsg}>{n.message}</p>
                    <span className={styles.itemTime}>{timeAgo(n.createdAt)}</span>
                  </div>

                  <button
                    className={styles.dismissBtn}
                    onClick={e => { e.stopPropagation(); dismissOne(n.id); }}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
