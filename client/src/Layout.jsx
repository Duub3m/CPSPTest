import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import TopNavbar from './TopNavbar';
import { AuthContext } from './AuthContextProvider';

const Layout = () => {
  const { role } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="layout">
      <TopNavbar />
      <div className="layout-content">
        <Navbar role={role} handleLogout={handleLogout} />
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
