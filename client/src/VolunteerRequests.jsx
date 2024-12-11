import React, { useState, useEffect } from 'react';
import './VolunteerRequests.css';

const VolunteerRequests = () => {
  const [email, setEmail] = useState(null); // Logged-in volunteer's email
  const [requests, setRequests] = useState([]); // Requests made by the volunteer
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch logged-in user's email
  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const userResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const userData = await userResponse.json();

        if (userData.loggedIn) {
          setEmail(userData.user.email);
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

  // Fetch requests for the logged-in volunteer
  useEffect(() => {
    if (!email) return;

    const fetchRequests = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/requests/volunteer/${email}`);
        if (!response.ok) {
          throw new Error('Failed to fetch requests');
        }
        const data = await response.json();

        // Sort requests in descending order (most recent first)
        const sortedRequests = data.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.from_time}`);
          const dateB = new Date(`${b.date}T${b.from_time}`);
          return dateB - dateA; // Most recent at the top
        });

        setRequests(sortedRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    fetchRequests();
  }, [email]);

  if (loading) {
    return <p>Loading your requests...</p>;
  }

  return (
    <div className="volunteer-requests-container">
      <h2>Your Requests</h2>
      {requests.length > 0 ? (
        <ul className="requests-list">
          {requests.map((req) => (
            <li key={req.id} className="request-item">
              <p><strong>Date:</strong> {req.date}</p>
              <p><strong>Activity:</strong> {req.activity}</p>
              <p><strong>Hours:</strong> {req.hours}</p>
              <p><strong>Status:</strong> <span className={`status ${req.status.toLowerCase()}`}>{req.status}</span></p>
            </li>
          ))}
        </ul>
      ) : (
        <p>You have no requests at the moment.</p>
      )}
    </div>
  );
};

export default VolunteerRequests;
