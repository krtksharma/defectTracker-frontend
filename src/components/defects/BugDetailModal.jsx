// src/components/defects/BugDetailModal.jsx — 4 tabs: Details | Comments | Attachments | History
import { useState, useEffect, useRef } from 'react';
import {
  updateDefect, getComments, addComment, deleteComment,
  getAttachments, uploadAttachment, deleteAttachment,
  getDefectHistory,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import styles from './BugDetailModal.module.css';

const P_COLORS  = { P1:{bg:'#fde8e8',color:'#e05252'}, P2:{bg:'#fef3e2',color:'#d97706'}, P3:{bg:'#edfaf3',color:'#16a34a'} };
const SEV_COLOR = { Blocking:'#dc2626',Critical:'#ef4444',Major:'#ea580c',Minor:'#d97706',Low:'#16a34a' };
const ST_COLOR  = { Open:'#3b82f6','In Progress':'#a855f7',Resolved:'#10b981',Closed:'#6b7280' };
const ROLE_CLR  = { tester:'#8b5cf6', developer:'#3b82f6', productowner:'#10b981' };
const ACT_ICON  = { STATUS_CHANGED:'🔄', ASSIGNED:'📌', BUG_CREATED:'🐛', RESOLVED:'✅', COMMENT_ADDED:'💬', ATTACHMENT_ADDED:'📎' };
const ACT_CLR   = { STATUS_CHANGED:'#f59e0b', ASSIGNED:'#3b82f6', BUG_CREATED:'#6b7280', RESOLVED:'#10b981', COMMENT_ADDED:'#8b5cf6', ATTACHMENT_ADDED:'#ea580c' };

export default function BugDetailModal({ bug, onClose, onUpdated }) {
  const { user, permissions } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('details');

  // Details
  const [status,     setStatus]   = useState(bug.status || 'Open');
  const [resolution, setRes]      = useState('');
  const [saving,     setSaving]   = useState(false);
  const [saveMsg,    setSaveMsg]  = useState('');

  // Comments
  const [comments,   setComments]   = useState([]);
  const [commLoad,   setCommLoad]   = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commSaving, setCommSaving] = useState(false);
  const commEnd = useRef(null);

  // Attachments
  const [attachments, setAttachments] = useState([]);
  const [attLoad,     setAttLoad]     = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [dragOver,    setDragOver]    = useState(false);
  const fileRef = useRef(null);

  // History
  const [history,  setHistory]  = useState([]);
  const [histLoad, setHistLoad] = useState(false);

  const pBadge  = P_COLORS[bug.priority]  || {bg:'#f3f4f6',color:'#6b7280'};
  const sColor  = SEV_COLOR[bug.severity] || '#6b7280';
  const stColor = ST_COLOR[bug.status]    || '#6b7280';

  useEffect(() => {
    if (tab === 'comments')    loadComments();
    if (tab === 'attachments') loadAttachments();
    if (tab === 'history')     loadHistory();
  }, [tab]);

  useEffect(() => { commEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [comments]);

  const loadComments = async () => {
    setCommLoad(true);
    try { const r = await getComments(bug.id); setComments(Array.isArray(r.data) ? r.data : []); }
    catch { setComments([]); } finally { setCommLoad(false); }
  };
  const loadAttachments = async () => {
    setAttLoad(true);
    try { const r = await getAttachments(bug.id); setAttachments(Array.isArray(r.data) ? r.data : []); }
    catch { setAttachments([]); } finally { setAttLoad(false); }
  };
  const loadHistory = async () => {
    setHistLoad(true);
    try { const r = await getDefectHistory(bug.id); setHistory(Array.isArray(r.data) ? r.data : []); }
    catch { setHistory([]); } finally { setHistLoad(false); }
  };

  // ── Details: update bug ──────────────────────────────────────────
  const handleUpdate = async () => {
    // Resolution only required when marking Resolved or Closed
    const needsResolution = (status === 'Resolved' || status === 'Closed');
    if (needsResolution && !resolution.trim()) {
      setSaveMsg('⚠️ Please add a resolution note when marking as Resolved/Closed.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: bug.id, status,
        updatedBy: user?.userName,
        updatedByRole: user?.role,
        resolutions: resolution.trim()
          ? [{ resolution, resolutiondate: new Date().toISOString().split('T')[0] }]
          : [],
      };
      await updateDefect(payload);
      toast('Bug updated successfully!', 'success');
      onUpdated();
      setSaveMsg('');
    } catch { toast('Failed to update bug.', 'error'); }
    finally { setSaving(false); }
  };

  // ── Comments ─────────────────────────────────────────────────────
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setCommSaving(true);
    try {
      const r = await addComment(bug.id, user?.userName, user?.role, newComment.trim());
      setComments(p => [...p, r.data]);
      setNewComment('');
    } catch { toast('Failed to post comment.', 'error'); }
    finally { setCommSaving(false); }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    try { await deleteComment(id); setComments(p => p.filter(c => c.id !== id)); }
    catch { alert('Failed to delete.'); }
  };

  // ── Attachments ──────────────────────────────────────────────────
  const handleFileUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Max 10MB.'); return; }
    setUploading(true);
    try {
      const r = await uploadAttachment(bug.id, file, user?.userName);
      setAttachments(p => [...p, r.data]);
    } catch(e) { alert(e.response?.data?.error || 'Upload failed.'); }
    finally { setUploading(false); }
  };

  const handleDeleteAttachment = async (id) => {
    if (!window.confirm('Delete attachment?')) return;
    try { await deleteAttachment(id); setAttachments(p => p.filter(a => a.id !== id)); }
    catch { alert('Failed to delete.'); }
  };

  const isImage = t => t && t.startsWith('image/');
  const fmtBytes = b => !b ? '—' : b < 1024 ? b+'B' : b < 1048576 ? (b/1024).toFixed(1)+'KB' : (b/1048576).toFixed(1)+'MB';
  const timeAgo = s => {
    if (!s) return '';
    const d = Date.now() - new Date(s).getTime(), m = Math.floor(d/60000);
    if (m < 1) return 'just now'; if (m < 60) return m+'m ago';
    const h = Math.floor(m/60); if (h < 24) return h+'h ago';
    return Math.floor(h/24)+'d ago';
  };

  const TABS = [
    { key:'details',     label:'Details',    icon:'📋' },
    { key:'comments',    label:'Discussion', icon:'💬' },
    { key:'attachments', label:'Files',      icon:'📎' },
    { key:'history',     label:'History',    icon:'🕒' },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.topLeft}>
            <span className={styles.bugIdBadge}>#{bug.id}</span>
            <span className={styles.projectBadge}>Project #{bug.projectcode}</span>
            <span className={styles.statusPill} style={{background:`${stColor}18`,color:stColor}}>{bug.status}</span>
          </div>
          <div className={styles.topRight}>
            <span className={styles.pill} style={{background:pBadge.bg,color:pBadge.color}}>{bug.priority}</span>
            <span className={styles.pill} style={{background:`${sColor}18`,color:sColor}}>{bug.severity}</span>
            <button className={styles.closeBtn} onClick={onClose}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className={styles.titleRow}>
          <h2 className={styles.bugTitle}>{bug.title}</h2>
        </div>

        {/* Tab nav */}
        <div className={styles.tabNav}>
          {TABS.map(t => (
            <button key={t.key} className={`${styles.tabBtn} ${tab===t.key ? styles.tabActive : ''}`} onClick={() => setTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className={styles.tabBody}>

          {/* ══ DETAILS ══ */}
          {tab === 'details' && (
            <div className={styles.detailsLayout}>
              <div className={styles.detailsLeft}>

                <Section title="📋 Description">
                  <p className={styles.bodyText}>{bug.defectdetails || '—'}</p>
                </Section>

                <Section title="🔢 Steps to Reproduce">
                  <p className={styles.bodyText}>{bug.stepstoreproduce || '—'}</p>
                </Section>

                {/* Expected vs Actual */}
                <Section title="🎯 Expected vs Actual">
                  <div className={styles.expActGrid}>
                    <div className={styles.expBox}>
                      <div className={styles.expLabel}>✅ Expected</div>
                      <p className={styles.bodyText}>{bug.expectedbehavior || 'Not specified'}</p>
                    </div>
                    <div className={styles.actBox}>
                      <div className={styles.actLabel}>❌ Actual</div>
                      <p className={styles.bodyText}>{bug.actualbehavior || 'Not specified'}</p>
                    </div>
                  </div>
                </Section>

                <Section title="📌 Details">
                  <div className={styles.detailGrid}>
                    <DetailCell label="Detected On"  value={bug.detectedon} />
                    <DetailCell label="Expected Fix" value={bug.expectedresolution} />
                    <DetailCell label="Reported By"  value={bug.reportedbytesterid} />
                    <DetailCell label="Assigned Dev" value={bug.assignedtodeveloperid} />
                  </div>
                </Section>

                {bug.resolutions?.length > 0 && (
                  <Section title={`✅ Resolution History (${bug.resolutions.length})`}>
                    {bug.resolutions.map((r, i) => (
                      <div key={i} className={styles.resItem}>
                        <span className={styles.resDate}>📅 {r.resolutiondate}</span>
                        <p className={styles.bodyText}>{r.resolution}</p>
                      </div>
                    ))}
                  </Section>
                )}
              </div>

              <div className={styles.detailsRight}>
                {permissions?.canResolve ? (
                  <div className={styles.actionPanel}>
                    <div className={styles.panelTitle}>✏️ Update Bug</div>
                    <div className={styles.formField}>
                      <label>Status</label>
                      <select value={status} onChange={e => setStatus(e.target.value)} className={styles.select}>
                        <option>Open</option><option>In Progress</option>
                        <option>Resolved</option><option>Closed</option>
                      </select>
                    </div>
                    <div className={styles.formField}>
                      <label>Resolution Note {(status==='Resolved'||status==='Closed') && <span className={styles.req}>* required</span>}</label>
                      <textarea value={resolution} onChange={e => setRes(e.target.value)}
                        placeholder={`Describe what was fixed…${status==="In Progress" ? " (optional for In Progress)" : ""}`} className={styles.textarea} rows={4} />
                    </div>
                    {saveMsg && <div className={saveMsg.startsWith('✅') ? styles.msgOk : styles.msgErr}>{saveMsg}</div>}
                    <button onClick={handleUpdate} disabled={saving} className={styles.updateBtn}>
                      {saving ? <><span className={styles.btnSpinner}/> Saving…</> : '✓ Save Update'}
                    </button>
                  </div>
                ) : (
                  <div className={styles.readonlyPanel}>
                    <div className={styles.panelTitle}>ℹ️ Bug Info</div>
                    <p className={styles.rolesNote}>Only developers can update bugs.</p>
                    <QuickStat label="Priority" value={bug.priority} color={pBadge.color} />
                    <QuickStat label="Severity" value={bug.severity} color={sColor} />
                    <QuickStat label="Status"   value={bug.status}   color={stColor} />
                  </div>
                )}
                <div className={styles.timelineBox}>
                  <div className={styles.timelineTitle}>Timeline</div>
                  <TLItem color="#6b7280" label="Detected"    value={bug.detectedon} />
                  <TLItem color="#f59e0b" label="Expected Fix" value={bug.expectedresolution} />
                  {bug.resolutions?.[bug.resolutions.length-1] && (
                    <TLItem color="#10b981" label="Last Resolved" value={bug.resolutions[bug.resolutions.length-1].resolutiondate} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ COMMENTS ══ */}
          {tab === 'comments' && (
            <div className={styles.commentsLayout}>
              <div className={styles.commentsList}>
                {commLoad ? <Loader text="Loading discussion…" /> :
                 comments.length === 0 ? <Empty icon="💬" text="No comments yet. Start the discussion!" /> :
                 comments.map(c => (
                  <div key={c.id} className={`${styles.commentItem} ${c.author===user?.userName ? styles.commentMine : ''}`}>
                    <div className={styles.commentAvatar} style={{background: ROLE_CLR[c.authorRole] || '#6b7280'}}>
                      {c.author?.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.commentBubble}>
                      <div className={styles.commentMeta}>
                        <span className={styles.commentAuthor}>{c.author}</span>
                        <span className={styles.commentRole} style={{color: ROLE_CLR[c.authorRole] || '#6b7280'}}>{c.authorRole}</span>
                        <span className={styles.commentTime}>{timeAgo(c.createdAt)}</span>
                        {c.author === user?.userName && (
                          <button className={styles.delCommentBtn} onClick={() => handleDeleteComment(c.id)}>✕</button>
                        )}
                      </div>
                      <p className={styles.commentContent}>{c.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={commEnd} />
              </div>

              {(permissions?.canCreate || permissions?.canResolve) && (
                <div className={styles.commentInput}>
                  <div className={styles.commentAvatar} style={{background: ROLE_CLR[user?.role] || '#6b7280'}}>
                    {user?.userName?.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.commentInputWrap}>
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Write a comment… (Ctrl+Enter to send)"
                      className={styles.commentTextarea}
                      rows={2}
                      onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddComment(); }}
                    />
                    <div className={styles.commentFooter}>
                      <span className={styles.commentHint}>Ctrl + Enter to send</span>
                      <button onClick={handleAddComment} disabled={commSaving || !newComment.trim()} className={styles.sendBtn}>
                        {commSaving ? '…' : 'Send →'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ ATTACHMENTS ══ */}
          {tab === 'attachments' && (
            <div className={styles.attLayout}>
              {permissions?.canCreate && (
                <div
                  className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files[0]); }}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.log,.csv,.zip" className={styles.fileInput}
                    onChange={e => { handleFileUpload(e.target.files?.[0]); e.target.value=''; }} />
                  {uploading
                    ? <><span className={styles.tabSpinner}/> Uploading…</>
                    : <><div className={styles.dropIcon}>📎</div>
                        <div className={styles.dropText}><strong>Click to upload</strong> or drag & drop</div>
                        <div className={styles.dropHint}>PNG, JPG, PDF, TXT, LOG, CSV, ZIP — Max 10MB</div></>
                  }
                </div>
              )}

              {attLoad ? <Loader text="Loading files…" /> :
               attachments.length === 0 ? <Empty icon="📎" text={`No files attached.${permissions?.canCreate ? ' Upload a screenshot or log above.' : ''}`} /> :
               <div className={styles.attList}>
                 {attachments.map(a => (
                   <div key={a.id} className={styles.attCard}>
                     {isImage(a.fileType)
                       ? <a href={a.downloadUrl} target="_blank" rel="noreferrer" className={styles.attThumbWrap}>
                           <img src={a.downloadUrl} alt={a.originalName} className={styles.attThumb} />
                         </a>
                       : <div className={styles.attIconBox}>
                           <span className={styles.attIcon}>
                             {a.fileType?.includes('pdf') ? '📄' : a.fileType?.includes('zip') ? '🗜' : a.originalName?.endsWith('.log') ? '📝' : '📎'}
                           </span>
                         </div>
                     }
                     <div className={styles.attInfo}>
                       <a href={a.downloadUrl} target="_blank" rel="noreferrer" className={styles.attName}>{a.originalName}</a>
                       <div className={styles.attMeta}>{fmtBytes(a.fileSize)} · {a.uploadedBy} · {a.uploadedAt ? new Date(a.uploadedAt).toLocaleDateString() : ''}</div>
                     </div>
                     <div className={styles.attBtns}>
                       <a href={a.downloadUrl} target="_blank" rel="noreferrer" className={styles.attView} title="View">
                         <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                       </a>
                       {permissions?.canCreate && (
                         <button className={styles.attDel} onClick={() => handleDeleteAttachment(a.id)} title="Delete">
                           <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                         </button>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
              }
            </div>
          )}

          {/* ══ HISTORY ══ */}
          {tab === 'history' && (
            <div className={styles.historyLayout}>
              {histLoad ? <Loader text="Loading history…" /> :
               history.length === 0 ? <Empty icon="🕒" text="No history recorded yet." /> :
               <div className={styles.historyList}>
                 {history.map((h, i) => (
                   <div key={h.id} className={styles.historyItem}>
                     <div className={styles.historyLeft}>
                       <div className={styles.historyIconWrap} style={{background:`${ACT_CLR[h.actionType]||'#6b7280'}18`,color:ACT_CLR[h.actionType]||'#6b7280'}}>
                         {ACT_ICON[h.actionType] || '📝'}
                       </div>
                       {i < history.length - 1 && <div className={styles.historyLine} />}
                     </div>
                     <div className={styles.historyBody}>
                       <div className={styles.historyNote}>{h.note}</div>
                       {(h.oldValue || h.newValue) && (
                         <div className={styles.historyValues}>
                           {h.oldValue && <span className={styles.oldVal}>{h.oldValue}</span>}
                           {h.oldValue && h.newValue && <span className={styles.arrow}>→</span>}
                           {h.newValue && <span className={styles.newVal}>{h.newValue}</span>}
                         </div>
                       )}
                       <div className={styles.historyMeta}>
                         <span className={styles.historyActor} style={{color: ROLE_CLR[h.performerRole]||'#6b7280'}}>
                           {h.performedBy}
                         </span>
                         <span className={styles.historyTime}>{timeAgo(h.createdAt)}</span>
                         {h.createdAt && (
                           <span className={styles.historyDate}>{new Date(h.createdAt).toLocaleString()}</span>
                         )}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
              }
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Small helpers ───────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}
function DetailCell({ label, value }) {
  return (
    <div className={styles.detailCell}>
      <div className={styles.detailLabel}>{label}</div>
      <div className={styles.detailValue}>{value || '—'}</div>
    </div>
  );
}
function QuickStat({ label, value, color }) {
  return (
    <div className={styles.quickStat}>
      <span className={styles.qsLabel}>{label}</span>
      <span className={styles.qsValue} style={{color}}>{value||'—'}</span>
    </div>
  );
}
function TLItem({ color, label, value }) {
  return (
    <div className={styles.tlItem}>
      <div className={styles.tlDot} style={{background:color}} />
      <div><div className={styles.tlLabel}>{label}</div><div className={styles.tlValue}>{value||'—'}</div></div>
    </div>
  );
}
function Loader({ text }) {
  return <div className={styles.loader}><span className={styles.tabSpinner}/>{text}</div>;
}
function Empty({ icon, text }) {
  return <div className={styles.empty}><div className={styles.emptyIcon}>{icon}</div><p>{text}</p></div>;
}
