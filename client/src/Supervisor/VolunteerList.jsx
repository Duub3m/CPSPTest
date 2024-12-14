import React, { useState, useEffect } from 'react';
import '../VolunteerList.css'; // Create a CSS file for styling

const VolunteerList = () => {
  const [email, setEmail] = useState(null); // Supervisor's email
  const [volunteers, setVolunteers] = useState([]); // List of volunteers
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch logged-in user's email
  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.loggedIn) {
          setEmail(data.user.email);
        } else {
          console.error('Supervisor not logged in');
        }
      } catch (error) {
        console.error('Error fetching logged-in user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoggedInUser();
  }, []);

  // Fetch the list of volunteers
  useEffect(() => {
    if (!email) return;

    const fetchVolunteers = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/supervisor/volunteers/${email}`);
        if (!response.ok) {
          throw new Error('Failed to fetch volunteers');
        }
        const data = await response.json();
        setVolunteers(data);
      } catch (error) {
        console.error('Error fetching volunteers:', error);
      }
    };

    fetchVolunteers();
  }, [email]);

  if (loading) {
    return <p>Loading volunteers...</p>;
  }

  return (
    <div className="volunteer-list-container">
      <h2>Volunteers Under Your Supervision</h2>
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
        <p>You currently have no volunteers assigned.</p>
      )}
    </div>
  );
};

export default VolunteerList;
