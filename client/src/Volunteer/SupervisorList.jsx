import React, { useState, useEffect } from 'react';
import '../SupervisorList.css'; // Create a CSS file for styling

const SupervisorList = () => {
  const [email, setEmail] = useState(null); // Logged-in volunteer's email
  const [supervisors, setSupervisors] = useState([]); // List of supervisors
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch logged-in user's email
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
      } finally {
        setLoading(false);
      }
    };

    fetchLoggedInUser();
  }, []);

  // Fetch the list of supervisors
  useEffect(() => {
    if (!email) return;

    const fetchSupervisors = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/supervisors/by-volunteer/${email}`);
        if (!response.ok) {
          throw new Error('Failed to fetch supervisors');
        }
        const data = await response.json();
        setSupervisors(data);
      } catch (error) {
        console.error('Error fetching supervisors:', error);
      }
    };

    fetchSupervisors();
  }, [email]);

  if (loading) {
    return <p>Loading supervisors...</p>;
  }

  return (
    <div className="supervisor-list-container">
      <h2>Your Supervisors</h2>
      {supervisors.length > 0 ? (
        <ul className="supervisor-list">
          {supervisors.map((supervisor) => (
            <li key={supervisor.supervisor_email} className="supervisor-item">
              <p><strong>Name:</strong> {supervisor.supervisor_first_name} {supervisor.supervisor_last_name}</p>
              <p><strong>Email:</strong> {supervisor.supervisor_email}</p>
              <p><strong>Assigned Since:</strong> {new Date(supervisor.created_at).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>You currently have no assigned supervisors.</p>
      )}
    </div>
  );
};

export default SupervisorList;
