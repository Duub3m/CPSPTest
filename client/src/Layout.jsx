import React from 'react';
import { Outlet } from 'react-router-dom'; // To render child routes
import Navbar from './Navbar'; // Import Navbar

const Layout = ({ role, handleLogout }) => {
  return (
    <div>
      <Navbar role={role} handleLogout={handleLogout} />
      <main className="main-content">
        <Outlet /> {/* Placeholder for child components */}
      </main>
    </div>
  );
};

export default Layout;
