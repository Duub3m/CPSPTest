import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import { FaBell, FaSignOutAlt, FaUser, FaTrophy } from 'react-icons/fa'; // Imported FaTrophy icon
import { AuthContext } from './AuthContextProvider';

const Navbar = ({ role, handleLogout }) => {
  const { isSidebarOpen } = useContext(AuthContext);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [adminRequestCount, setAdminRequestCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const userResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const userData = await userResponse.json();

        if (!userData.loggedIn) {
          console.error('User not logged in');
          return;
        }

        const userEmail = userData.user.email;

        if (role === 'Supervisor') {
          const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/requests/count/${userEmail}`);
          if (!response.ok) throw new Error('Failed to fetch pending request count');
          const data = await response.json();
          setPendingRequestCount(data.pending_count);
        }

        if (role === 'Admin') {
          const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/admin/requests/count`);
          if (!response.ok) throw new Error('Failed to fetch admin request count');
          const data = await response.json();
          setAdminRequestCount(data.pending_count);
        }

        const notificationResponse = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/notifications/count/${userEmail}`);
        if (!notificationResponse.ok) throw new Error('Failed to fetch notification count');
        const notificationData = await notificationResponse.json();
        setNotificationCount(notificationData.unread_count);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
  }, [role]);

  return (
    <div className={`navbar ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
      <ul>
        <li>
          <Link to="/Profile2">
            <FaUser /> {isSidebarOpen && 'Profile'}
          </Link>
        </li>

        <li>
          <a
            href="https://www.albany.edu/community-public-service-program/service-opportunities"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaTrophy /> {isSidebarOpen && 'Volunteer Opportunities'} {/* Replaced emoji with FaTrophy */}
          </a>
        </li>

        {role === 'Volunteer' && (
          <>
            <li><Link to="/Volunteer/Dashboard">📊 {isSidebarOpen && 'Dashboard'}</Link></li>
            <li><Link to="/Volunteer/AddHours">⏳ {isSidebarOpen && 'Add Hours'}</Link></li>
            <li><Link to="/Volunteer/Requests">📑 {isSidebarOpen && 'Requests'}</Link></li>
            <li><Link to="/Volunteer/SupervisorList">📝 {isSidebarOpen && 'Supervisor List'}</Link></li>
            <li><Link to="/Volunteer/Registration">📝 {isSidebarOpen && 'Registration'}</Link></li>
            <li><Link to="/Volunteer/LogOfHours">📝 {isSidebarOpen && 'LogOfHours'}</Link></li>
          </>
        )}

        {role === 'Supervisor' && (
          <li>
            <Link to="/Supervisor/Requests">
              📩 {isSidebarOpen && `Requests (${pendingRequestCount})`}
            </Link>
          </li>
        )}

        {role === 'Admin' && (
          <li>
            <Link to="/Admin/Requests">
              🛠 {isSidebarOpen && `Requests (${adminRequestCount})`}
            </Link>
          </li>
        )}

        <li>
          <Link to="/Messaging">
            <FaBell /> {isSidebarOpen && 'Messaging'}
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Navbar;
