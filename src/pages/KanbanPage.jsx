// src/pages/KanbanPage.jsx
// Drag & Drop Kanban board using @dnd-kit
import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { getAllDefects, updateDefect } from '../services/api';
import Header from '../components/layout/Header';
import styles from './KanbanPage.module.css';

const COLUMNS = [
  { id: 'Open', label: '🔴 Open', color: '#ef4444', bg: '#fef2f2' },
  { id: 'In Progress', label: '🟡 In Progress', color: '#f59e0b', bg: '#fffbeb' },
  { id: 'Resolved', label: '🟢 Resolved', color: '#10b981', bg: '#f0fdf4' },
  { id: 'Closed', label: '⚫ Closed', color: '#6b7280', bg: '#f9fafb' },
];

export default function KanbanPage() {
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [toast, setToast] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchDefects = () => {
    setLoading(true);
    getAllDefects()
      .then((res) => setDefects(res.data))
      .catch(() => setDefects([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDefects(); }, []);

  // Group defects by status
  const columns = COLUMNS.map((col) => ({
    ...col,
    bugs: defects.filter((d) => d.status === col.id),
  }));

  const activeBug = defects.find((d) => d.id === activeId);

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over) return;

    const bugId = active.id;
    const newStatus = over.id; // over.id is a column id

    const bug = defects.find((d) => d.id === bugId);
    if (!bug || bug.status === newStatus) return;

    // Optimistically update UI
    setDefects((prev) =>
      prev.map((d) => (d.id === bugId ? { ...d, status: newStatus } : d))
    );

    // Save to backend
    try {
      await updateDefect({
        id: bugId,
        status: newStatus,
        resolutions: [],
      });
      showToast(`✅ Moved to "${newStatus}"`);
    } catch {
      // Rollback
      setDefects((prev) =>
        prev.map((d) => (d.id === bugId ? { ...d, status: bug.status } : d))
      );
      showToast('❌ Failed to update status');
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div className={styles.page}>
      <Header title="Kanban Board" subtitle="Drag & drop bugs to update their status" />

      {toast && <div className={styles.toast}>{toast}</div>}

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading kanban board...</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className={styles.board}>
              {columns.map((col) => (
                <KanbanColumn key={col.id} column={col} />
              ))}
            </div>

            {/* Drag preview overlay */}
            <DragOverlay>
              {activeBug ? <KanbanCardPreview bug={activeBug} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}

/* ─── Column ─── */
function KanbanColumn({ column }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnOver : ''}`}
      style={{ '--col-color': column.color, '--col-bg': column.bg }}
    >
      {/* Column Header */}
      <div className={styles.colHeader}>
        <div className={styles.colLabel}>{column.label}</div>
        <div className={styles.colCount} style={{ background: column.bg, color: column.color }}>
          {column.bugs.length}
        </div>
      </div>

      {/* Cards */}
      <div className={styles.cardList}>
        {column.bugs.length === 0 ? (
          <div className={styles.emptyCol}>
            Drop bugs here
          </div>
        ) : (
          column.bugs.map((bug) => (
            <KanbanCard key={bug.id} bug={bug} />
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Draggable Card ─── */
function KanbanCard({ bug }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: bug.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const priorityColors = { P1: '#ef4444', P2: '#f59e0b', P3: '#22c55e' };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${styles.kanbanCard} ${isDragging ? styles.draggingCard : ''}`}
    >
      <div className={styles.cardTopRow}>
        <span
          className={styles.priorityDot}
          style={{ background: priorityColors[bug.priority] || '#ccc' }}
        />
        <span className={styles.cardId}>#{bug.id}</span>
        <span className={styles.severity}>{bug.severity}</span>
      </div>
      <div className={styles.cardTitle}>{bug.title}</div>
      <div className={styles.cardDesc}>{bug.defectdetails}</div>
      <div className={styles.cardFooter}>
        <span className={styles.cardDate}>📅 {bug.detectedon}</span>
        <span className={styles.cardDev}>
          {bug.assignedtodeveloperid?.charAt(0).toUpperCase() || 'D'}
        </span>
      </div>
    </div>
  );
}

/* ─── Drag Overlay Preview ─── */
function KanbanCardPreview({ bug }) {
  return (
    <div className={`${styles.kanbanCard} ${styles.draggingCard}`}>
      <div className={styles.cardTitle}>{bug.title}</div>
      <div className={styles.cardDesc}>{bug.defectdetails}</div>
    </div>
  );
}
