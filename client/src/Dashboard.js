import React, { useEffect, useState } from 'react';
import axios from 'axios'; 

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // To manage loading state

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true); // Set loading state
        const { data } = await axios.get(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, { withCredentials: true });
        
        if (data.loggedIn) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false); // Stop loading after fetch is done
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_SERVER_URL}/auth/logout`, {}, { withCredentials: true });
      setUser(null); // Clear the user from state
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) return <div>Loading...</div>; // Display a loading indicator while fetching user data

  if (!user) return <div>Please login to view your dashboard</div>;

  return (
    <div>
      <h3>Welcome, {user.name}</h3>
      <img src={user.picture} alt={user.name} style={{ borderRadius: '50%', width: '100px', height: '100px' }} />
      <p>Email: {user.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;
