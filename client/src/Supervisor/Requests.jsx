import React, { useState, useEffect } from 'react';
import '../Requests.css';

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(null); // Supervisor email

  // Fetch logged-in supervisor email and registration requests
  useEffect(() => {
    const fetchSupervisorEmailAndRequests = async () => {
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

        // Fetch registration requests for the supervisor
        const requestsResponse = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/registration-requests/supervisor/${userData.user.email}`
        );
        if (!requestsResponse.ok) throw new Error('Failed to fetch registration requests');

        const requestsData = await requestsResponse.json();
        const sortedRequests = requestsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setRequests(sortedRequests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupervisorEmailAndRequests();
  }, []);

  // Handle approval or rejection of requests
  const handleRequestAction = async (volunteerEmail, status) => {
    try {
      // Update request status via API
      const response = await fetch(
        `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/registration-requests/supervisor/${volunteerEmail}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, supervisor_email: email }),
        }
      );

      if (!response.ok) throw new Error(`Failed to ${status.toLowerCase()} request`);

      // Update the requests list locally after approval or rejection
      setRequests((prevRequests) => prevRequests.filter((request) => request.volunteer_email !== volunteerEmail));

      // Display success message
      alert(
        status === 'Pending Admin Approval'
          ? `Request approved successfully. It has been forwarded to the admin for final approval.`
          : `Request rejected successfully.`
      );
    } catch (error) {
      console.error(`Error processing request:`, error);
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
      {requests.length === 0 ? (
        <p>No pending requests at the moment.</p>
      ) : (
        <ul className="requests-list">
          {requests.map((request) => (
            <li key={request.volunteer_email} className="request-item">
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
                  onClick={() =>
                    handleRequestAction(request.volunteer_email, 'Pending Admin Approval')
                  }
                  className="approve-btn"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleRequestAction(request.volunteer_email, 'Rejected')}
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
