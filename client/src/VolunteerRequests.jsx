import React, { useState, useEffect } from 'react';
import './VolunteerRequests.css';

const VolunteerRequests = () => {
  const [email, setEmail] = useState(null); // Logged-in volunteer's email
  const [hourRequests, setHourRequests] = useState([]); // Hour Requests
  const [registrationRequests, setRegistrationRequests] = useState([]); // Registration Requests
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

  // Fetch hour requests for the logged-in volunteer
  useEffect(() => {
    if (!email) return;

    const fetchHourRequests = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/requests/volunteer/${email}`);
        if (!response.ok) {
          throw new Error('Failed to fetch hour requests');
        }
        const data = await response.json();

        // Sort hour requests by the most recent (descending order by date and time)
        const sortedRequests = data.sort((a, b) => {
          const dateTimeA = new Date(`${a.date}T${a.from_time}`);
          const dateTimeB = new Date(`${b.date}T${b.from_time}`);
          return dateTimeB - dateTimeA; // Most recent first
        });

        setHourRequests(sortedRequests);
      } catch (error) {
        console.error('Error fetching hour requests:', error);
      }
    };

    fetchHourRequests();
  }, [email]);

  // Fetch registration requests for the logged-in volunteer
  useEffect(() => {
    if (!email) return;

    const fetchRegistrationRequests = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/registration-requests/volunteer/${email}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch registration requests');
        }
        const data = await response.json();

        // Sort registration requests by the most recent (descending order by created_at)
        const sortedRequests = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRegistrationRequests(sortedRequests);
      } catch (error) {
        console.error('Error fetching registration requests:', error);
      }
    };

    fetchRegistrationRequests();
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
    return date.toLocaleDateString('en-US', options);
  };

  if (loading) {
    return <p>Loading your requests...</p>;
  }

  return (
    <div className="volunteer-requests-container">
      <h2>Your Requests</h2>
  <h3>Registration Requests</h3>
        {registrationRequests.length > 0 ? (
          <ul className="requests-list">
            {registrationRequests.map((req) => (
              <li key={req.id} className="request-item">
                <p><strong>Course:</strong> {req.course_name}</p>
                <p><strong>Semester:</strong> {req.semester}</p>
                <p><strong>Year:</strong> {req.year}</p>
                <p><strong>Organization:</strong> {req.organization}</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={`status ${req.status.toLowerCase()}`}>{req.status}</span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>You have no registration requests at the moment.</p>
        )}
      <h3>Hour Requests</h3>
      {hourRequests.length > 0 ? (
        <ul className="requests-list">
          {hourRequests.map((req) => (
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
        <p>You have no hour requests at the moment.</p>
      )}

      
    </div>
  );
};

export default VolunteerRequests;
