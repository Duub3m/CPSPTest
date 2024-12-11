import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Database.css'; // Optional: Add styling if needed

const Database = () => {
  const serverUrl = process.env.REACT_APP_MYSQL_SERVER_URL; // Use your environment variable for the backend URL
  const [volunteers, setVolunteers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [volunteerHours, setVolunteerHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true);

        // Fetch volunteers
        const volunteersRes = await axios.get(`${serverUrl}/api/volunteers`);
        setVolunteers(volunteersRes.data);

        // Fetch supervisors
        const supervisorsRes = await axios.get(`${serverUrl}/api/supervisors`);
        setSupervisors(supervisorsRes.data);

        // Fetch volunteer hours
        const volunteerHoursRes = await axios.get(`${serverUrl}/api/volunteering-hours`);
        setVolunteerHours(volunteerHoursRes.data);

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data. Please try again.');
        setLoading(false);
      }
    };

    fetchTables();
  }, [serverUrl]);

  return (
    <div className="database-page">
      <h1>Database Tables</h1>

      {loading && <p>Loading data...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="tables-container">
          {/* Volunteers Table */}
          <div className="table-container">
            <h2>Volunteers</h2>
            {volunteers.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((volunteer) => (
                    <tr key={volunteer.id}>
                      <td>{volunteer.id}</td>
                      <td>{volunteer.first_name}</td>
                      <td>{volunteer.last_name}</td>
                      <td>{volunteer.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No volunteers found.</p>
            )}
          </div>

          {/* Supervisors Table */}
          <div className="table-container">
            <h2>Supervisors</h2>
            {supervisors.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {supervisors.map((supervisor) => (
                    <tr key={supervisor.id}>
                      <td>{supervisor.id}</td>
                      <td>{supervisor.first_name}</td>
                      <td>{supervisor.last_name}</td>
                      <td>{supervisor.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No supervisors found.</p>
            )}
          </div>

          {/* Volunteer Hours Table */}
          <div className="table-container">
            <h2>Volunteer Hours</h2>
            {volunteerHours.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Volunteer ID</th>
                    <th>Hours</th>
                    <th>Date</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteerHours.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.id}</td>
                      <td>{entry.volunteer_id}</td>
                      <td>{entry.hours}</td>
                      <td>{entry.date}</td>
                      <td>{entry.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No volunteer hours found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Database;
