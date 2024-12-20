import React, { useState, useEffect } from 'react';
import '../Requests.css';

const Requests = () => {
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [hoursRequests, setHoursRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(null); // Supervisor email

  // Fetch supervisor email and requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Fetch logged-in supervisor email
        const userResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const userData = await userResponse.json();

        if (!userData.loggedIn) {
          console.error('Supervisor not logged in');
          return;
        }

        setEmail(userData.user.email);

        // Fetch registration requests
        const regRequestsResponse = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/registration-requests/supervisor/${userData.user.email}`
        );
        if (!regRequestsResponse.ok) throw new Error('Failed to fetch registration requests');
        const regRequestsData = await regRequestsResponse.json();

        // Fetch logged hours requests
        const hoursRequestsResponse = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/hours-requests/supervisor/${userData.user.email}`
        );
        if (!hoursRequestsResponse.ok) throw new Error('Failed to fetch hours requests');
        const hoursRequestsData = await hoursRequestsResponse.json();

        // Filter requests with the status 'Pending'
        const pendingRegRequests = regRequestsData.filter((request) => request.status === 'Pending Supervisor Approval');
        const pendingHoursRequests = hoursRequestsData.filter((request) => request.status === 'Pending');

        setRegistrationRequests(pendingRegRequests);
        setHoursRequests(pendingHoursRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Helper function to convert military time to 12-hour format with AM/PM
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const intHours = parseInt(hours, 10);
    const period = intHours >= 12 ? 'PM' : 'AM';
    const formattedHours = intHours % 12 || 12; // Convert 0 or 12 to 12
    return `${formattedHours}:${minutes} ${period}`;
  };

  // Handle approval or rejection of registration requests
  const handleRequestAction = async (requestId, status) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/registration-requests/supervisor/${email}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, request_id: requestId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`Failed to ${status.toLowerCase()} registration request`);
      }

      setRegistrationRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== requestId)
      );
      alert(`Registration request ${status.toLowerCase()} successfully.`);
    } catch (error) {
      console.error('Error processing registration request:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // Handle approval or rejection of hours requests
  const handleHoursRequestAction = async (requestId, status) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/requests/supervisor/${email}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, request_id: requestId }),
        }
      );

      if (!response.ok) throw new Error(`Failed to ${status.toLowerCase()} hours request`);

      setHoursRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== requestId)
      );
      alert(`Hours request ${status.toLowerCase()} successfully.`);
    } catch (error) {
      console.error(`Error processing hours request:`, error);
      alert(`An error occurred. Please try again.`);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  if (loading) return <p>Loading requests...</p>;

  return (
    <div className="requests-container">
      <h2>Pending Supervisor Approvals</h2>

      {/* Registration Requests */}
      <h3>Registration Requests</h3>
      {registrationRequests.length === 0 ? (
        <p>No pending registration requests.</p>
      ) : (
        <ul className="requests-list">
          {registrationRequests.map((request) => (
            <li key={request.id} className="request-item">
              <p>
                <strong>Volunteer Name:</strong> {request.first_name} {request.last_name}
              </p>
              <p>
                <strong>Course:</strong> {request.course_name}
              </p>
              <p>
                <strong>Semester:</strong> {request.semester} {request.year}
              </p>
              <p>
                <strong>Organization:</strong> {request.organization}
              </p>
              <p>
                <strong>Status:</strong> {request.status}
              </p>
              <p>
                <strong>Submitted On:</strong> {formatDate(request.created_at)}
              </p>
              <div className="actions">
                <button
                  onClick={() => handleRequestAction(request.id, 'Pending Admin Approval')}
                  className="approve-btn"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleRequestAction(request.id, 'Rejected')}
                  className="reject-btn"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Hours Requests */}
      <h3>Logged Hours Requests</h3>
      {hoursRequests.length === 0 ? (
        <p>No pending hours requests.</p>
      ) : (
        <ul className="requests-list">
          {hoursRequests.map((request) => (
            <li key={request.id} className="request-item">
              <p>
                <strong>Volunteer Name:</strong> {request.first_name} {request.last_name}
              </p>
              <p>
                <strong>Class:</strong> {request.class_name}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(request.date)}
              </p>
              <p>
                <strong>Time:</strong> {formatTime(request.from_time)} - {formatTime(request.to_time)}
              </p>
              <p>
                <strong>Hours:</strong> {request.hours}
              </p>
              <p>
                <strong>Activity:</strong> {request.activity}
              </p>
              <p>
                <strong>Status:</strong> {request.status}
              </p>
              <div className="actions">
                <button
                  onClick={() => handleHoursRequestAction(request.id, 'Approved')}
                  className="approve-btn"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleHoursRequestAction(request.id, 'Rejected')}
                  className="reject-btn"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Requests;
