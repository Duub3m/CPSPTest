import React, { useContext } from 'react';
import './Profile.css';
import UABG2 from './UABG2.jpeg';
import PF from './pf(de).jpeg';
import { AuthContext } from '../App'; // Import AuthContext directly from App.js

const Profile = () => {
  const { user } = useContext(AuthContext); // Access user data from AuthContext

  return (
    <div>
      {/* Cover Photo */}
      <div className="cover-photo">
        <img src={UABG2} alt="Cover" />
      </div>
      
      {/* Profile layout */}
      <div className="profile-container">
        <div className="navbar-card">
          <nav className="sidebar">
            <ul>
              <li><a href="#">Dashboard</a></li>
              <li><a href="#">Profile</a></li>
              <li><a href="#">Volunteer Opportunities</a></li>
            </ul>
          </nav>
        </div>

        <div className="profile-description-card">
          <h2>Edit Profile</h2>
          
          <div className="form-section">
            <h3>USER INFORMATION</h3>
            <div className="form-group">
              <div>
                <label>First name</label>
                <input type="text" value={user?.name?.split(' ')[0] || ''} readOnly />
              </div>
              <div>
                <label>Last name</label>
                <input type="text" value={user?.name?.split(' ')[1] || ''} readOnly />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>CONTACT INFORMATION</h3>
            <div className="form-group">
              <div>
                <label>Email address</label>
                <input type="email" value={user?.email || ''} readOnly />
              </div>
              <div>
                <label>Phone number</label>
                <input type="text" value="332-200-7722" readOnly />
              </div>
            </div>
          </div>

          <div className="form-section about-me">
            <h3>ABOUT ME</h3>
            <div className="form-group">
              <div className="full-width">
                <label>About me</label>
                <textarea readOnly>{user?.about || 'I enjoy working on community outreach projects.'}</textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Right Profile Card */}
        <div className="profile-card">

          {/* Cover Photo */}
          <div className="cover-photo">
            <img src={UABG2} alt="Profile Cover" />
          </div>

          {/* Profile Image */}
          <div className="profile-image-wrapper">
            <img
              className="profile-image"
              src={user?.picture || PF}
              alt="User profile"
            />
          </div>

          {/* Connect & Message Buttons */}
          <div className="profile-actions">
            <button className="btn-connect">View Hours</button>
            <button className="btn-message">View Course</button>
          </div>

          {/* Service Hours */}
          <div className="profile-stats">
            <div>
              <h3>45</h3>
              <p>Service Hours</p>
            </div>
          </div>

          {/* User Info */}
          <div className="profile-info">
            <h2>{user?.name || 'Dubem Eneh'}</h2>
            <p><i className="location-icon"></i> New York City, NY</p>
            <p><i className="job-icon"></i> Computer Science Major</p>
            <p><i className="education-icon"></i> University at Albany</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
