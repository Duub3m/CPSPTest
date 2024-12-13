import React, { useState, useEffect } from 'react';
import './VolunteerList.css';

const VolunteerListAdmin = () => {
  const [volunteers, setVolunteers] = useState([]); // List of all volunteers
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch the list of all volunteers
  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/volunteers`);
        if (!response.ok) {
          throw new Error('Failed to fetch volunteers.');
        }
        const data = await response.json();
        setVolunteers(data);
      } catch (error) {
        console.error('Error fetching volunteers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteers();
  }, []);

  if (loading) {
    return <p>Loading volunteers...</p>;
  }

  return (
    <div className="volunteer-list-container">
      <h2>All Volunteers</h2>
      {volunteers.length > 0 ? (
        <ul className="volunteer-list">
          {volunteers.map((volunteer) => (
            <li key={volunteer.email} className="volunteer-item">
              <p><strong>Name:</strong> {volunteer.first_name} {volunteer.last_name}</p>
              <p><strong>Email:</strong> {volunteer.email}</p>
              <p><strong>Total Hours:</strong> {volunteer.total_hours}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No volunteers found.</p>
      )}
    </div>
  );
};

export default VolunteerListAdmin;
