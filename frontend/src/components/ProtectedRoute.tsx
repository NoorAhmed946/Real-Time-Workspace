import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { loading } = useAuth();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center pt-16">
        <p className="font-label text-on-surface-variant">Loading...</p>
      </main>
    );
  }

  return <>{children}</>;
}
