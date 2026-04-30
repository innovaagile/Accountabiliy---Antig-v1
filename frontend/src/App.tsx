import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import MainLayout from './components/layout/MainLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import GestionFrases from './pages/dashboard/GestionFrases';
import DetalleCoachee from './pages/dashboard/DetalleCoachee';
import CambiarPassword from './pages/CambiarPassword';
import { MisAvances } from './pages/dashboard/MisAvances';

import Diagnostico from './pages/Diagnostico';
import { AdminMetricsDashboard } from './pages/dashboard/AdminMetricsDashboard';
import CoacheeDashboard from './pages/dashboard/CoacheeDashboard';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/diagnostico" 
            element={
              <ProtectedRoute>
                <Diagnostico />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cambiar-password" 
            element={
              <ProtectedRoute>
                <CambiarPassword />
              </ProtectedRoute>
            } 
          />
          
          {/* Rutas protegidas envueltas en el MainLayout */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            } 
          >
            <Route index element={<DashboardHome />} />
            <Route path="usuarios" element={<div className="p-4 bg-white rounded shadow-sm">Módulo Usuarios (Construcción)</div>} />
            <Route path="configuracion" element={<div className="p-4 bg-white rounded shadow-sm">Configuración (Construcción)</div>} />
            <Route path="frases" element={<GestionFrases />} />
            <Route path="coachee/:id" element={<DetalleCoachee />} />
            <Route path="view/:coacheeId" element={<CoacheeDashboard />} />
            <Route path="avances" element={<MisAvances />} />

          </Route>

          {/* Rutas de Admin */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <MainLayout />
              </AdminRoute>
            } 
          >
            <Route path="metrics" element={<AdminMetricsDashboard />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
