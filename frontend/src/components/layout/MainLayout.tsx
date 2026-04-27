import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CoacheeTopBar from './CoacheeTopBar';
import { useAuth } from '../../context/AuthContext';

const MainLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isCoachee = user?.role === 'COACHEE';
  const isMisAvances = location.pathname.includes('/avances');

  if (isCoachee) {
    return (
      <div className={`min-h-screen flex flex-col ${isMisAvances ? 'bg-[#E6E9E1]' : 'bg-[#EAECE6]'}`}>
        <CoacheeTopBar />
        <main className={`flex-1 w-full ${isMisAvances ? '' : 'mt-8 px-4 lg:px-8 max-w-7xl mx-auto'}`}>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAECE6] flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 mt-16 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
