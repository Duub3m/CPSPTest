import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import Navbar from './Navbar'; // Import the Navbar component
import UABG2 from './UABG2.jpeg';
import { AuthContext } from './AuthContextProvider';

const Profile = () => {
  const { checkLoginState } = useContext(AuthContext);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [totalHours, setTotalHours] = useState(0);
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.loggedIn) {
          setEmail(data.user.email);
        } else {
          console.error('User not logged in');
        }
      } catch (error) {
        console.error('Error fetching logged-in user:', error);
      }
    };

    fetchLoggedInUser();
  }, []);

  useEffect(() => {
    if (!email) return;

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/user/email/${email}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        setUser(data.user);
        setRole(data.role);
        if (data.role === 'Volunteer') {
          setTotalHours(data.user.total_hours || 0);
        }
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
        credentials: 'include',
      });
      checkLoginState();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (loading) {
    return <p>Loading profile...</p>;
  }

  return (
    <div>
      <Navbar role={role} handleLogout={handleLogout} />
      <div className="main-content">
        <div className="cover-photo">
          <img src={user?.coverPhoto || UABG2} alt="Cover" />
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
            <textarea readOnly>{user?.about || 'No description provided.'}</textarea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
