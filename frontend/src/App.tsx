import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import MainLayout from './components/layout/MainLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import GestionFrases from './pages/dashboard/GestionFrases';
import DetalleCoachee from './pages/dashboard/DetalleCoachee';

import Diagnostico from './pages/Diagnostico';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
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

          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
