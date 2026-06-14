import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const routeLanguage = location.pathname.split('/')[1];
  const language = routeLanguage === 'en' ? 'en' : 'mk';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-siena-200 border-t-siena-600"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <Navigate
        to={`/${language}/admin/login`}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
