import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './SupabaseAuthContext';

interface AdminContextType {
  editMode: boolean;
  toggleEditMode: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      setEditMode(false);
    }
  }, [isAdmin]);

  const toggleEditMode = () => {
    if (isAdmin) {
      setEditMode((previous) => !previous);
    }
  };

  return (
    <AdminContext.Provider value={{ editMode, toggleEditMode }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
