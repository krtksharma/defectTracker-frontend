// src/services/api.js
import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8084/api';

const api = axios.create({
  // This looks for the secret injected by GitHub Actions
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
// ── AUTH ──────────────────────────────────────────────────────────────
export const loginUser      = (userName, password)       => api.post('/users/login', { userName, password });
export const registerUser   = (userName, password, role) => api.post('/users/register', { userName, password, role });
export const getUsersByRole = (role)                     => api.get(`/users/role/${role}`);
export const getAllUsers     = ()                         => api.get('/users/all');

// ── DEFECTS ───────────────────────────────────────────────────────────
export const getAllDefects          = ()            => api.get('/defects/getAll');
export const getDefectById         = (id)          => api.get(`/defects/${id}`);
export const getDefectsByDeveloper = (devId)       => api.get(`/defects/assignedto/${devId}`);
export const getDefectReport       = (projectId)   => api.get(`/defects/report/${projectId}`);
export const createDefect          = (data)        => api.post('/defects/new', data);
export const updateDefect          = (data)        => api.put('/defects/resolve', data);

// ── COMMENTS ─────────────────────────────────────────────────────────
export const getComments   = (defectId)                              => api.get(`/defects/${defectId}/comments`);
export const addComment    = (defectId, author, authorRole, content) => api.post(`/defects/${defectId}/comments`, { author, authorRole, content });
export const deleteComment = (commentId)                             => api.delete(`/comments/${commentId}`);

// ── ATTACHMENTS ───────────────────────────────────────────────────────
export const getAttachments = (defectId) => api.get(`/defects/${defectId}/attachments`);

export const uploadAttachment = (defectId, file, uploadedBy) => {
  const form = new FormData();
  form.append('file', file);
  form.append('uploadedBy', uploadedBy);

  // FIX: Use 'api.post' instead of 'axios.post'
  // FIX: Remove the leading '/api' because your baseURL already includes it
  return api.post(`/defects/${defectId}/attachments`, form, {
    headers: { 
      'Content-Type': 'multipart/form-data' 
      // Note: 'api' instance handles your Authorization headers automatically if configured
    },
  });
};

export const deleteAttachment = (id) => api.delete(`/attachments/${id}`);

// ── AUDIT / HISTORY ───────────────────────────────────────────────────
export const getDefectHistory = (defectId) => api.get(`/defects/${defectId}/history`);

// ── NOTIFICATIONS ─────────────────────────────────────────────────────
export const getNotifications    = ()     => api.get('/notifications');          // unread only
export const getAllNotifications = ()     => api.get('/notifications/all');      // history
export const getUnreadCount      = ()     => api.get('/notifications/unread/count');
export const markNotifRead       = (id)   => api.put(`/notifications/${id}/read`);
export const markAllNotifsRead   = ()     => api.put('/notifications/read-all');

export default api;
