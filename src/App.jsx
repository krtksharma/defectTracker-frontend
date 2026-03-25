// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';

import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BugsPage      from './pages/BugsPage';
import KanbanPage    from './pages/KanbanPage';
import CreateBugPage from './pages/CreateBugPage';
import ReportPage    from './pages/ReportPage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login"     element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard" element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
      <Route path="/bugs"      element={<PrivateRoute><Layout><BugsPage /></Layout></PrivateRoute>} />
      <Route path="/create"    element={<RoleRoute allowedRoles={['tester']}><Layout><CreateBugPage /></Layout></RoleRoute>} />
      <Route path="/kanban"    element={<RoleRoute allowedRoles={['developer']}><Layout><KanbanPage /></Layout></RoleRoute>} />
      <Route path="/report"    element={<RoleRoute allowedRoles={['productowner']}><Layout><ReportPage /></Layout></RoleRoute>} />
      <Route path="/"          element={<Navigate to="/dashboard" replace />} />
      <Route path="*"          element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
