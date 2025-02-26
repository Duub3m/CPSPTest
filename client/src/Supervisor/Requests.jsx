import React, { useState, useEffect } from 'react';
import '../Requests.css';

const Requests = () => {
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [hoursRequests, setHoursRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(null); // Supervisor email

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Fetch logged-in user details
        const userResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const userData = await userResponse.json();

        if (!userData.loggedIn) {
          console.error('Supervisor not logged in');
          return;
        }

        setEmail(userData.user.email);

        // Fetch registration requests for the supervisor
        const registrationRequestsResponse = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/registration-requests/supervisor/${userData.user.email}`
        );
        if (!registrationRequestsResponse.ok) throw new Error('Failed to fetch registration requests');
        const registrationRequestsData = await registrationRequestsResponse.json();
        setRegistrationRequests(registrationRequestsData);

        // Fetch pending hours requests for the supervisor
        const hoursRequestsResponse = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/requests/${userData.user.email}`
        );
        if (!hoursRequestsResponse.ok) throw new Error('Failed to fetch hours requests');
        const hoursRequestsData = await hoursRequestsResponse.json();
        setHoursRequests(hoursRequestsData);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Send notification function
  const sendNotification = async (receiverEmail, senderEmail, type, message) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_email: receiverEmail,
          sender_email: senderEmail,
          notification_type: type,
          message,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to send notification to ${receiverEmail}`);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // Fetch all admin emails from the Users table
const getAdminEmails = async () => {
  try {
    const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/admins`);
    if (!response.ok) throw new Error('Failed to fetch admin emails');
    const data = await response.json();
    return data.map((admin) => admin.email); // Ensure it returns an array of emails
  } catch (error) {
    console.error('Error fetching admin emails:', error);
    return [];
  }
};


  // Handle approval or rejection of registration requests
  const handleRegistrationRequestAction = async (requestId, status, volunteerEmail, firstName, lastName, courseName) => {
    try {
      const mappedStatus = status === 'Approved' ? 'Pending Admin Approval' : 'Rejected';

      const response = await fetch(
        `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/registration-requests/supervisor/${email}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: mappedStatus, volunteer_email: volunteerEmail }),
        }
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to ${status.toLowerCase()} registration request: ${errorMessage}`);
      }

      // Notify based on status
      if (status === 'Approved') {
        const adminEmails = await getAdminEmails();
        adminEmails.forEach((adminEmail) => {
          sendNotification(
            adminEmail,
            email,
            'Approval',
            `Supervisor approved a registration request for ${firstName} ${lastName} in the course ${courseName}.`
          );
        });
      } else {
        sendNotification(
          volunteerEmail,
          email,
          'Rejection',
          `Your registration request for ${courseName} has been rejected by the supervisor.`
        );
      }

      // Update UI
      setRegistrationRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== requestId)
      );
      alert(`Registration request ${status.toLowerCase()} successfully.`);
    } catch (error) {
      console.error(`Error processing registration request:`, error);
      alert(`An error occurred: ${error.message}`);
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
              <p><strong>Volunteer Name:</strong> {request.first_name} {request.last_name}</p>
              <p><strong>Course:</strong> {request.course_name}</p>
              <p><strong>Organization:</strong> {request.organization}</p>
              <p><strong>Semester:</strong> {request.semester} {request.year}</p>
              <p><strong>Status:</strong> {request.status}</p>
              <div className="actions">
                <button
                  onClick={() => handleRegistrationRequestAction(
                    request.id,
                    'Approved',
                    request.volunteer_email,
                    request.first_name,
                    request.last_name,
                    request.course_name
                  )}
                  className="approve-btn"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleRegistrationRequestAction(
                    request.id,
                    'Rejected',
                    request.volunteer_email,
                    request.first_name,
                    request.last_name,
                    request.course_name
                  )}
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
              <p><strong>Volunteer Name:</strong> {request.volunteer_first_name} {request.volunteer_last_name}</p>
              <p><strong>Class:</strong> {request.class_name}</p>
              <p><strong>Date:</strong> {request.date}</p>
              <p><strong>Hours:</strong> {request.hours}</p>
              <p><strong>Status:</strong> {request.status}</p>
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
