import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import CoacheeTopBar from './CoacheeTopBar';
import { useAuth } from '../../context/AuthContext';

const MainLayout = () => {
  const { user } = useAuth();
  const isCoachee = user?.role === 'COACHEE';

  if (isCoachee) {
    return (
      <div className="min-h-screen bg-[#EAECE6] flex flex-col">
        <CoacheeTopBar />
        <main className="flex-1 w-full mt-8 px-4 lg:px-8 max-w-7xl mx-auto">
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
