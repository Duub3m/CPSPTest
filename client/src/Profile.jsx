import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import TopNavbar from './TopNavbar';
import { AuthContext } from './AuthContextProvider';

const Profile = () => {
  const { checkLoginState } = useContext(AuthContext);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [totalHours, setTotalHours] = useState(0);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');

  // Fetch logged-in user's email
  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error(`Failed to fetch user: ${response.status}`);

        const data = await response.json();
        if (data.loggedIn && data.user?.email) {
          setEmail(data.user.email);
        } else {
          console.warn('User not logged in.');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error fetching logged-in user:', error);
      }
    };

    fetchLoggedInUser();
  }, [navigate]);

  // Fetch user data
  useEffect(() => {
    if (!email) return;

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/user/email/${email}`);
        if (!response.ok) throw new Error(`Failed to fetch user data: ${response.status}`);

        const data = await response.json();
        setUser(data);
        setRole(data.role || 'Unknown');
        if (data.role === 'Volunteer') {
          setTotalHours(data.total_hours ?? 0);
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

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="profile-page">
      <TopNavbar />

      <div className="main-content">
        <div className="profile-description-card">
          <h2>Edit Profile</h2>

          <div className="form-section">
            <h3>USER INFORMATION</h3>
            <div className="form-group">
              <div>
                <label>First Name</label>
                <input type="text" value={user?.first_name ?? ''} readOnly />
              </div>
              <div>
                <label>Last Name</label>
                <input type="text" value={user?.last_name ?? ''} readOnly />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>CONTACT INFORMATION</h3>
            <div className="form-group">
              <div>
                <label>Email Address</label>
                <input type="email" value={user?.email ?? ''} readOnly />
              </div>
              <div>
                <label>Phone Number</label>
                <input type="text" value={user?.phone_number ?? 'N/A'} readOnly />
              </div>
            </div>
          </div>

          <div className="form-section about-me">
            <h3>ABOUT ME</h3>
            <textarea readOnly value={user?.about ?? 'No description provided.'}></textarea>
          </div>

          {role === 'Volunteer' && (
            <div className="form-section">
              <h3>TOTAL HOURS</h3>
              <p>{totalHours}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
