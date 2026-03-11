import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './SupabaseAuthContext';

interface AdminState {
  isAuthenticated: boolean;
  editMode: boolean;
  loading: boolean;
}

interface AdminContextType {
  state: AdminState;
  editMode: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  toggleEditMode: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

interface AdminProviderProps {
  children: ReactNode;
}

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    }),
  ]);

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const { user, isAdmin, loading, signIn, signOut } = useAuth();
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) {
      setEditMode(false);
    }
  }, [user, isAdmin]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await withTimeout(
      signIn(email, password),
      15000,
      'Login timed out. Please try again.',
    );
    if (error) {
      return false;
    }

    const {
      data: { user: signedInUser },
      error: userError,
    } = await withTimeout(
      supabase.auth.getUser(),
      10000,
      'Fetching authenticated user timed out.',
    );

    if (userError || !signedInUser) {
      await withTimeout(signOut(), 10000, 'Sign out timed out.');
      return false;
    }

    const { data: profile, error: profileError } = await withTimeout(
      supabase
        .from('profiles')
        .select('role')
        .eq('user_id', signedInUser.id)
        .maybeSingle(),
      10000,
      'Fetching profile timed out.',
    );

    if (profileError || !profile || profile.role !== 'admin') {
      await withTimeout(signOut(), 10000, 'Sign out timed out.');
      return false;
    }

    return true;
  };

  const logout = async () => {
    setEditMode(false);
    await withTimeout(signOut(), 10000, 'Logout timed out.');
  };

  const toggleEditMode = () => {
    if (!user || !isAdmin) {
      return;
    }
    setEditMode((prev) => !prev);
  };

  const state: AdminState = {
    isAuthenticated: Boolean(user && isAdmin),
    editMode,
    loading,
  };

  return (
    <AdminContext.Provider
      value={{
        state,
        editMode,
        login,
        logout,
        toggleEditMode,
      }}
    >
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
