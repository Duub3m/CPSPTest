import React, { useContext } from 'react';
import './Profile.css';
import UABG2 from './UABG2.jpeg'; // Default cover photo
import { AuthContext } from './AuthContextProvider'; // Access AuthContext

const Profile2 = () => {
  const { user, role, totalHours } = useContext(AuthContext); // Get user data from AuthContext

  return (
    <div className="profile-container">
      {/* Right Profile Card */}
      <div className="profile-card">
        {/* Profile Image */}
        <div className="profile-image-wrapper">
          <img
            className="profile-image"
            src={user?.picture || 'https://example.com/default-profile.png'} // Use user's profile photo or fallback
            alt={`${user?.first_name || 'User'}'s profile`}
          />
        </div>

        {/* User Info */}
        <div className="profile-info">
          <h2>{`${user?.first_name || ''} ${user?.last_name || ''}`}</h2>
          <p><i className="job-icon"></i> {role || 'N/A'}</p>
          <p><i className="location-icon"></i> {user?.location || 'Location not set'}</p>
          <p><i className="education-icon"></i> University at Albany</p>
          {role === 'Volunteer' && (
            <h3>Total Volunteering Hours: {totalHours}</h3>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile2;
