import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Profile.css';
import UABG2 from './UABG2.jpeg'; // Default cover photo
import { AuthContext } from './AuthContextProvider'; // Access AuthContext

const Profile = () => {
  const { checkLoginState } = useContext(AuthContext); // Access context functions
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // State to store user data
  const [totalHours, setTotalHours] = useState(0); // State to store total volunteering hours
  const [email, setEmail] = useState(null); // State for user email
  const [loading, setLoading] = useState(true); // State for loading status

  // Fetch the signed-in user's email
  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include', // Ensure cookies are sent with the request
        });
        const data = await response.json();
        if (data.loggedIn) {
          setEmail(data.user.email); // Set the email from the authenticated user
        } else {
          console.error('User not logged in');
        }
      } catch (error) {
        console.error('Error fetching logged-in user:', error);
      }
    };

    fetchLoggedInUser();
  }, []);

  // Fetch user data once the email is available
  useEffect(() => {
    if (!email) return;

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/volunteering-hours/email/${email}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        setUser(data);
        setTotalHours(data.total_hours || 0);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [email]);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Ensure cookies are included
      });
      checkLoginState(); // Update login state
      navigate('/login'); // Redirect to login
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (loading) {
    return <p>Loading profile...</p>; // Handle loading state
  }

  return (
    <div>
      {/* Cover Photo */}
      <div className="cover-photo">
        <img 
          src={user?.coverPhoto || UABG2} // Use user's cover photo or fallback
          alt="Cover"
        />
      </div>
      
      {/* Profile layout */}
      <div className="profile-container">
        <div className="navbar-card">
          <nav className="sidebar">
            <ul>
              <li><a href="#">Dashboard</a></li>
              <li><a href="#">Profile</a></li>
              <li><a href="#">Volunteer Opportunities</a></li>
              <li><Link to="/add-hours">Add Hours</Link></li> {/* Link to Add Hours */}
              <li><button className="btn-logout" onClick={handleLogout}>Logout</button></li>
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
                <input type="text" value={user?.first_name || ''} readOnly />
              </div>
              <div>
                <label>Last name</label>
                <input type="text" value={user?.last_name || ''} readOnly />
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
                <input type="text" value={user?.phoneNumber || 'N/A'} readOnly />
              </div>
            </div>
          </div>

          <div className="form-section about-me">
            <h3>ABOUT ME</h3>
            <div className="form-group">
              <div className="full-width">
                <label>About me</label>
                <textarea readOnly>{user?.about || 'No description provided.'}</textarea>
              </div>
            </div>
          </div>
        </div>

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
            <p><i className="job-icon"></i> {user?.major || 'N/A'}</p>
            <p><i className="location-icon"></i> {user?.location || 'Location not set'}</p>
            <p><i className="education-icon"></i> University at Albany</p>
            <h3>Total Volunteering Hours: {totalHours}</h3> {/* Display total hours */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
