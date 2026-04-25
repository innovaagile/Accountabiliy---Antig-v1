import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import CoacheeDashboard from './CoacheeDashboard';

const DashboardHome = () => {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  } else if (user?.role === 'COACHEE') {
    return <CoacheeDashboard />;
  }

  // Fallback
  return null;
};

export default DashboardHome;