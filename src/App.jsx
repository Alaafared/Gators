import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider as SupabaseAuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import Login from '@/components/Login';
import AdminDashboard from '@/components/admin/AdminDashboard';
import TrainerDashboard from '@/components/trainer/TrainerDashboard';
import TraineeDashboard from '@/components/trainee/TraineeDashboard';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">{t('loading')}</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const userRole = user.user_metadata?.role || 'trainee';

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to={`/${userRole}`} replace />;
  }

  return children;
};

const AppContent = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/trainer" element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <TrainerDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/trainee" element={
            <ProtectedRoute allowedRoles={['trainee']}>
              <TraineeDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/trainee" replace />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toaster />
    </Router>
  );
};

function App() {
  return (
    <LanguageProvider>
      <SupabaseAuthProvider>
        <AppContent />
      </SupabaseAuthProvider>
    </LanguageProvider>
  );
}

export default App;