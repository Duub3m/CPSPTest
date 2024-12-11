import React, { useState, useEffect } from 'react';
import './Requests.css';

const Requests = () => {
  const [requests, setRequests] = useState([]); // State to hold the requests
  const [loading, setLoading] = useState(true); // State for loading status
  const [email, setEmail] = useState(null); // State for supervisor email

  useEffect(() => {
    const fetchSupervisorEmailAndRequests = async () => {
      try {
        // Fetch logged-in user's email
        const userResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const userData = await userResponse.json();

        if (!userData.loggedIn) {
          console.error('Supervisor not logged in');
          return;
        }

        setEmail(userData.user.email);

        // Fetch hour requests for the supervisor
        const requestsResponse = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/requests/${userData.user.email}`);

        if (!requestsResponse.ok) {
          throw new Error('Failed to fetch hour requests');
        }

        const requestsData = await requestsResponse.json();
        setRequests(requestsData);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupervisorEmailAndRequests();
  }, []);

  const handleRequestAction = async (id, status) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${status.toLowerCase()} request`);
      }

      // Update the UI
      setRequests((prevRequests) => prevRequests.filter((request) => request.id !== id));
      alert(`Request ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error(`Error ${status.toLowerCase()} request:`, error);
      alert(`An error occurred while processing the request. Please try again.`);
    }
  };

  if (loading) {
    return <p>Loading requests...</p>;
  }

  return (
    <div className="requests-container">
      <h2>Pending Requests</h2>
      {requests.length === 0 ? (
        <p>No pending requests at the moment.</p>
      ) : (
        <ul className="requests-list">
          {requests.map((request) => (
            <li key={request.id} className="request-item">
              <p><strong>Volunteer Email:</strong> {request.volunteer_email}</p>
              <p><strong>Activity:</strong> {request.activity}</p>
              <p><strong>Date:</strong> {request.date}</p>
              <p><strong>From:</strong> {request.from_time}</p>
              <p><strong>To:</strong> {request.to_time}</p>
              <p><strong>Hours:</strong> {request.hours}</p>
              <div className="actions">
                <button onClick={() => handleRequestAction(request.id, 'Approved')} className="approve-btn">Approve</button>
                <button onClick={() => handleRequestAction(request.id, 'Rejected')} className="reject-btn">Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Requests;