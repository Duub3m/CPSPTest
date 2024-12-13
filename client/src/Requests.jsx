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

        // Sort requests to show the newest first
        const sortedRequests = requestsData.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRequests(sortedRequests);
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

      // Remove the request from the list after action
      setRequests((prevRequests) => prevRequests.filter((request) => request.id !== id));
      alert(`Request ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error(`Error ${status.toLowerCase()} request:`, error);
      alert(`An error occurred while processing the request. Please try again.`);
    }
  };

  const convertTo12HourFormat = (time) => {
    const [hour, minute] = time.split(':');
    const hourInt = parseInt(hour, 10);
    const isPM = hourInt >= 12;
    const adjustedHour = hourInt % 12 || 12; // Convert 0 to 12 for midnight
    const amPm = isPM ? 'PM' : 'AM';
    return `${adjustedHour}:${minute} ${amPm}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);

    // Add ordinal suffix (st, nd, rd, th) to the day
    const day = date.getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? 'st'
        : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
        ? 'rd'
        : 'th';

    return formattedDate.replace(/\d+/, `${day}${suffix}`);
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
              <p><strong>Volunteer Name:</strong> {request.volunteer_first_name} {request.volunteer_last_name}</p>
              <p><strong>Activity:</strong> {request.activity}</p>
              <p><strong>Date:</strong> {formatDate(request.date)}</p>
              <p><strong>From:</strong> {convertTo12HourFormat(request.from_time)}</p>
              <p><strong>To:</strong> {convertTo12HourFormat(request.to_time)}</p>
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
