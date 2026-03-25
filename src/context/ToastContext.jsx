// src/context/ToastContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

const ICONS = {
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
  warning: '⚠️',
};

const COLORS = {
  success: { bg: '#f0fdf4', border: 'rgba(16,185,129,0.3)', color: '#065f46', bar: '#10b981' },
  error:   { bg: '#fef2f2', border: 'rgba(239,68,68,0.3)',  color: '#991b1b', bar: '#ef4444' },
  info:    { bg: '#eff6ff', border: 'rgba(79,126,248,0.3)', color: '#1e40af', bar: '#3b82f6' },
  warning: { bg: '#fffbeb', border: 'rgba(245,158,11,0.3)', color: '#92400e', bar: '#f59e0b' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration + 400);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className={styles.container}>
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div key={t.id} className={styles.toast}
              style={{ background: c.bg, borderColor: c.border, color: c.color }}>
              <div className={styles.toastBar} style={{ background: c.bar,
                animationDuration: `${t.duration}ms` }} />
              <span className={styles.toastIcon}>{ICONS[t.type]}</span>
              <span className={styles.toastMsg}>{t.message}</span>
              <button className={styles.toastClose} onClick={() => remove(t.id)}>✕</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
