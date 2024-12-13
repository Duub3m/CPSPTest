import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Ensure this contains the updated CSS
import cpspLogo from './cpsp.png';

const Navbar = ({ role, handleLogout }) => {
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
        {role === 'Volunteer' && <li><Link to="/Dashboard">Dashboard</Link></li>}
        {role === 'Volunteer' && <li><Link to="/add-hours">Add Hours</Link></li>}
        {role === 'Volunteer' && <li><Link to="/VolunteerRequests">Requests</Link></li>}
        {role === 'Volunteer' && <li><Link to="/SupervisorList">Supervisor List</Link></li>}
        {role === 'Supervisor' && <li><Link to="/Requests">Requests</Link></li>}
        {role === 'Supervisor' && <li><Link to="/VolunteerList">Volunteer List</Link></li>}
        <li><Link to="/Messaging">Messages</Link></li>
        <li><button className="btn-logout" onClick={handleLogout}>Logout</button></li>
      </ul>
    </div>
  );
};

export default Navbar;
