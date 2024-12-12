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
  const [role, setRole] = useState(null); // State for user role

  // Fetch the signed-in user's email and role
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
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/user/email/${email}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        setUser(data.user);
        setRole(data.role); // Set the role (Supervisor, Volunteer, Admin)
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
              <li><Link to="/Profile2">Profile</Link></li>
              <li><a 
                    href="https://www.albany.edu/community-public-service-program/service-opportunities" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                Volunteer Opportunities
              </a></li>
              {role === 'Volunteer' && <li><Link to="/add-hours">Add Hours</Link></li>}
              {role === 'Volunteer' && <li><Link to="/VolunteerRequests">Requests</Link></li>}
              {role === 'Volunteer' && <li><Link to="/SupervisorList">Supervisor List</Link></li>}
              {role === 'Supervisor' && <li><Link to="/Requests">Requests</Link></li>}
              {role === 'Supervisor' && <li><Link to="/VolunteerList">Volunteer List</Link></li>}
              <li><Link to="/Messaging">Messages</Link></li>
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
      </div>
    </div>
  );
};

export default Profile;
