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

        // Sort requests by the most recent (descending order by date and time)
        const sortedRequests = data.sort((a, b) => {
          const dateTimeA = new Date(`${a.date}T${a.from_time}`);
          const dateTimeB = new Date(`${b.date}T${b.from_time}`);
          return dateTimeB - dateTimeA; // Most recent first
        });

        setRequests(sortedRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    fetchRequests();
  }, [email]);

  // Convert time to 12-hour format
  const convertTo12HourFormat = (time) => {
    const [hour, minute] = time.split(':');
    const hourInt = parseInt(hour, 10);
    const isPM = hourInt >= 12;
    const adjustedHour = hourInt % 12 || 12; // Convert 0 to 12 for midnight
    const amPm = isPM ? 'PM' : 'AM';
    return `${adjustedHour}:${minute} ${amPm}`;
  };

  // Format date with month, day, and year
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
    return <p>Loading your requests...</p>;
  }

  return (
    <div className="volunteer-requests-container">
      <h2>Your Requests</h2>
      {requests.length > 0 ? (
        <ul className="requests-list">
          {requests.map((req) => (
            <li key={req.id} className="request-item">
              <p><strong>Date:</strong> {formatDate(req.date)}</p>
              <p><strong>From:</strong> {convertTo12HourFormat(req.from_time)}</p>
              <p><strong>To:</strong> {convertTo12HourFormat(req.to_time)}</p>
              <p><strong>Activity:</strong> {req.activity}</p>
              <p><strong>Hours:</strong> {req.hours}</p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={`status ${req.status.toLowerCase()}`}>{req.status}</span>
              </p>
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
