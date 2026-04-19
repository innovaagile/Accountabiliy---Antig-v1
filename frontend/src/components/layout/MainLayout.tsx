import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const MainLayout = () => {
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
