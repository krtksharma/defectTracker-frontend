// src/context/AuthContext.jsx — JWT-aware auth context
import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const ROLE_PERMISSIONS = {
  tester:       { canCreate:true,  canResolve:false, canReport:false, canViewKanban:false, label:'Tester',        navItems:['dashboard','bugs','create'] },
  developer:    { canCreate:false, canResolve:true,  canReport:false, canViewKanban:true,  label:'Developer',     navItems:['dashboard','bugs','kanban'] },
  productowner: { canCreate:false, canResolve:false, canReport:true,  canViewKanban:false, label:'Product Owner', navItems:['dashboard','bugs','report'] },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bugtrackr_user')); } catch { return null; }
  });

  const login = (loginResponse) => {
    // loginResponse = { token, userName, role }
    const userData = {
      userName: loginResponse.userName,
      role:     loginResponse.role,
      token:    loginResponse.token,
    };
    setUser(userData);
    localStorage.setItem('bugtrackr_user', JSON.stringify(userData));
    // Set JWT on all future axios calls
    api.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.token}`;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bugtrackr_user');
    delete api.defaults.headers.common['Authorization'];
  };

  // Restore JWT header on page reload
  if (user?.token && !api.defaults.headers.common['Authorization']) {
    api.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
  }

  const permissions = user ? (ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.productowner) : null;

  return (
    <AuthContext.Provider value={{ user, login, logout, permissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
