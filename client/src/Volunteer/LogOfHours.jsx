import React, { useState, useEffect } from 'react';
import '../LogOfHours.css';

const LogOfHours = () => {
  const [logs, setLogs] = useState([]); // Approved logs
  const [classes, setClasses] = useState([]); // User's enrolled classes
  const [selectedClass, setSelectedClass] = useState(null); // Currently selected class
  const [loading, setLoading] = useState(true); // Loading state
  const [semester, setSemester] = useState('');
  const [organization, setOrganization] = useState('');
  const [supervisorName, setSupervisorName] = useState(''); // Supervisor name
  const [volunteerName, setVolunteerName] = useState(''); // Volunteer name

  // Fetch classes and user details
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch logged-in user details
        const userResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const userData = await userResponse.json();

        if (!userData.loggedIn) {
          console.error('User not logged in');
          return;
        }

        setVolunteerName(`${userData.user.first_name} ${userData.user.last_name}`);

        // Fetch supervisor details
        const supervisorResponse = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/supervisors/by-volunteer/${userData.user.email}`
        );
        const supervisorData = await supervisorResponse.json();

        if (supervisorData.length > 0) {
          const { supervisor_first_name, supervisor_last_name } = supervisorData[0];
          setSupervisorName(`${supervisor_first_name} ${supervisor_last_name}`);
        }

        // Fetch enrolled classes
        const classesResponse = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/volunteer-classes/${userData.user.email}`
        );
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch classes');
        }

        const classesData = await classesResponse.json();
        setClasses(classesData);

        if (classesData.length > 0) {
          setSelectedClass(classesData[0].class_name); // Default to the first class
          setSemester(classesData[0].semester); // Default semester
          setOrganization(classesData[0].organization); // Default organization
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Fetch logs for the selected class
  useEffect(() => {
    if (!selectedClass) return;

    const fetchLogs = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/logs?class_name=${selectedClass}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }

        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [selectedClass]);

  if (loading) {
    return <p>Loading logs...</p>;
  }

  return (
    <div className="log-of-hours-container">
      <h1>Log of Hours</h1>

      <div className="volunteer-info">
        <p><strong>Volunteer:</strong> {volunteerName}</p>
        <p><strong>Supervisor:</strong> {supervisorName}</p>
      </div>

      <div className="class-selector">
        <label htmlFor="class-select">Select Class:</label>
        <select
          id="class-select"
          value={selectedClass}
          onChange={(e) => {
            const selected = classes.find((c) => c.class_name === e.target.value);
            setSelectedClass(selected.class_name);
            setSemester(selected.semester);
            setOrganization(selected.organization);
          }}
        >
          {classes.map((classItem) => (
            <option key={classItem.class_name} value={classItem.class_name}>
              {classItem.class_name}
            </option>
          ))}
        </select>
      </div>

      <div className="class-info">
        <p><strong>Semester:</strong> {semester}</p>
        <p><strong>Organization:</strong> {organization}</p>
      </div>

      <table className="logs-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Hours</th>
            <th>Activity</th>
            <th>Total Hours (Running)</th>
          </tr>
        </thead>
        <tbody>
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <tr key={log.id}>
                <td>{new Date(log.date).toLocaleDateString()}</td>
                <td>{`${log.from_time} - ${log.to_time}`}</td>
                <td>{log.hours}</td>
                <td>{log.activity}</td>
                <td>{logs.slice(0, index + 1).reduce((sum, item) => sum + item.hours, 0)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No logs available for this class.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LogOfHours;
