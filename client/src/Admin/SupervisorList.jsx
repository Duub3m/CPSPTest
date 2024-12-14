import React, { useState, useEffect } from 'react';
import '../SupervisorList.css';

const SupervisorList = () => {
  const [supervisors, setSupervisors] = useState([]); // List of all supervisors
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch the list of all supervisors
  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/supervisors`);
        if (!response.ok) {
          throw new Error('Failed to fetch supervisors.');
        }
        const data = await response.json();
        setSupervisors(data);
      } catch (error) {
        console.error('Error fetching supervisors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupervisors();
  }, []);

  if (loading) {
    return <p>Loading supervisors...</p>;
  }

  return (
    <div className="supervisor-list-container">
      <h2>All Supervisors</h2>
      {supervisors.length > 0 ? (
        <ul className="supervisor-list">
          {supervisors.map((supervisor) => (
            <li key={supervisor.email} className="supervisor-item">
              <p><strong>Name:</strong> {supervisor.first_name} {supervisor.last_name}</p>
              <p><strong>Email:</strong> {supervisor.email}</p>
              <p><strong>Phone Number:</strong> {supervisor.phone_number}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No supervisors found.</p>
      )}
    </div>
  );
};

export default SupervisorList;
