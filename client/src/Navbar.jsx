import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Ensure this contains the updated CSS
import cpspLogo from './cpsp.png';

const Navbar = ({ role, handleLogout }) => {
  const [pendingRequestCount, setPendingRequestCount] = useState(0); // For Supervisors
  const [adminRequestCount, setAdminRequestCount] = useState(0); // For Admins

  useEffect(() => {
    const fetchPendingRequestCount = async () => {
      try {
        // Fetch logged-in user's email
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
          // Fetch pending request count for the supervisor
          const response = await fetch(
            `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/requests/count/${userEmail}`
          );

          if (!response.ok) {
            throw new Error('Failed to fetch pending request count');
          }

          const data = await response.json();
          setPendingRequestCount(data.pending_count);
        }

        if (role === 'Admin') {
          // Fetch pending admin registration request count
          const response = await fetch(
            `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/admin/requests/count`
          );

          if (!response.ok) {
            throw new Error('Failed to fetch admin request count');
          }

          const data = await response.json();
          setAdminRequestCount(data.pending_count);
        }
      } catch (error) {
        console.error('Error fetching request counts:', error);
      }
    };

    if (role === 'Supervisor' || role === 'Admin') {
      fetchPendingRequestCount();
    }
  }, [role]);

  return (
    <div className="navbar">
      <div className="navbar-logo">
        <img src={cpspLogo} alt="CPSP Logo" />
      </div>
      <ul>
        <li><Link to="/Profile2">Profile</Link></li>
        <li>
          <a
            href="https://www.albany.edu/community-public-service-program/service-opportunities"
            target="_blank"
            rel="noopener noreferrer"
          >
            Volunteer Opportunities
          </a>
        </li>
        {role === 'Volunteer' && (
          <>
            <li><Link to="/Volunteer/Dashboard">Dashboard</Link></li>
            <li><Link to="/Volunteer/AddHours">Add Hours</Link></li>
            <li><Link to="/Volunteer/Requests">Requests</Link></li>
            <li><Link to="/Volunteer/SupervisorList">Supervisor List</Link></li>
            <li><Link to="/Volunteer/Registration">Registration</Link></li>
            <li><Link to="/Volunteer/LogOfHours">Log of Hours</Link></li>
          </>
        )}
        {role === 'Supervisor' && (
          <>
            <li>
              <Link to="/Supervisor/Requests">
                Requests {pendingRequestCount > 0 && <span>{pendingRequestCount}</span>}
              </Link>
            </li>
            <li><Link to="/Supervisor/VolunteerList">Volunteer List</Link></li>
          </>
        )}
        {role === 'Admin' && (
          <>
            <li>
              <Link to="/Admin/Requests">
                Requests {adminRequestCount > 0 && <span>{adminRequestCount}</span>}
              </Link>
            </li>
            <li><Link to="/Admin/SupervisorList">Supervisor List</Link></li>
            <li><Link to="/Admin/VolunteerList">Volunteer List</Link></li>
          </>
        )}
        <li><Link to="/Messaging">Messages</Link></li>
        <li>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Navbar;
