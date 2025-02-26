import React, { useState, useEffect } from "react";
import "../Requests.css";

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");

  // Fetch the logged-in admin's email
  useEffect(() => {
    const fetchAdminEmail = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: "include",
        });
        const data = await response.json();

        if (data.loggedIn) {
          setAdminEmail(data.user.email);
        } else {
          console.error("Admin not logged in");
        }
      } catch (error) {
        console.error("Error fetching admin email:", error.message);
      }
    };

    fetchAdminEmail();
  }, []);

  // Fetch registration requests pending admin approval
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/registration-requests?status=Pending Admin Approval`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch registration requests.");
        }
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error("Error fetching registration requests:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Function to send notifications
  const sendNotification = async (receiverEmail, notificationType, message) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_email: receiverEmail,
          sender_email: adminEmail,
          notification_type: notificationType,
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification.");
      }
    } catch (error) {
      console.error("Error sending notification:", error.message);
    }
  };

  // Handle Approve/Reject Actions
  const handleAction = async (id, status, volunteerEmail, firstName, lastName, courseName) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/registration-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_email: adminEmail }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to update request status: ${errorMessage}`);
      }

      // Send notification based on action
      if (status === "Approved") {
        sendNotification(volunteerEmail, "Approval", 
          `Your registration request for ${courseName} has been approved.`);
      } else if (status === "Rejected") {
        sendNotification(volunteerEmail, "Rejection", 
          `Unfortunately, your registration request for ${courseName} has been rejected.`);
      }

      // Update UI
      setRequests((prevRequests) => prevRequests.filter((request) => request.id !== id));
      alert(`Request ${status.toLowerCase()} successfully.`);
    } catch (error) {
      console.error(`Error updating request status:`, error.message);
      alert("An error occurred while processing the request. Please try again.");
    }
  };

  if (loading) {
    return <p>Loading registration requests...</p>;
  }

  return (
    <div className="admin-requests-container">
      <h1>Registration Requests</h1>
      {requests.length === 0 ? (
        <p>No pending registration requests for admin approval.</p>
      ) : (
        <table className="requests-table">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Semester</th>
              <th>Year</th>
              <th>Organization</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.first_name}</td>
                <td>{request.last_name}</td>
                <td>{request.volunteer_email}</td>
                <td>{request.course_name}</td>
                <td>{request.semester}</td>
                <td>{request.year}</td>
                <td>{request.organization}</td>
                <td className={`status ${request.status.replace(/\s+/g, "-").toLowerCase()}`}>
                  {request.status}
                </td>
                <td>
                  {request.status === "Pending Admin Approval" && (
                    <>
                      <button
                        onClick={() =>
                          handleAction(
                            request.id,
                            "Approved",
                            request.volunteer_email,
                            request.first_name,
                            request.last_name,
                            request.course_name
                          )
                        }
                        className="approve-btn"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleAction(
                            request.id,
                            "Rejected",
                            request.volunteer_email,
                            request.first_name,
                            request.last_name,
                            request.course_name
                          )
                        }
                        className="reject-btn"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Requests;
