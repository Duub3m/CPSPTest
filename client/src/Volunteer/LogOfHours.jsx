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
  const [volunteerEmail, setVolunteerEmail] = useState(''); // Volunteer email
  const [volunteerName, setVolunteerName] = useState(''); // Volunteer name

  // Utility function to format time to 12-hour format
  const formatTime = (time) => {
    const [hours, minutes, seconds] = time.split(':');
    const intHours = parseInt(hours, 10);
    const period = intHours >= 12 ? 'PM' : 'AM';
    const formattedHours = intHours % 12 || 12; // Convert 0 to 12
    return `${formattedHours}:${minutes} ${period}`;
  };

  // Fetch user details and classes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const userData = await userResponse.json();

        if (!userData.loggedIn) {
          console.error('User not logged in');
          return;
        }

        setVolunteerName(`${userData.user.first_name} ${userData.user.last_name}`);
        setVolunteerEmail(userData.user.email);

        const classesResponse = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/volunteer-classes/${userData.user.email}`
        );
        if (!classesResponse.ok) throw new Error('Failed to fetch classes');
        const classesData = await classesResponse.json();
        setClasses(classesData);

        if (classesData.length > 0) {
          const defaultClass = classesData[0];
          setSelectedClass(defaultClass.class_name);
          setSemester(defaultClass.semester);
          setOrganization(defaultClass.organization);

          // Fetch supervisor for the default class's organization
          fetchSupervisor(userData.user.email, defaultClass.organization);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
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
        if (!response.ok) throw new Error('Failed to fetch logs');
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    fetchLogs();
  }, [selectedClass]);

  // Fetch supervisor details for a specific organization
  const fetchSupervisor = async (email, organization) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/supervisor-details/${email}/${organization}`
      );
      const data = await response.json();

      if (response.ok && data) {
        setSupervisorName(`${data.first_name} ${data.last_name}`);
      } else {
        setSupervisorName('No supervisor assigned');
      }
    } catch (error) {
      console.error('Error fetching supervisor details:', error);
      setSupervisorName('Error fetching supervisor');
    }
  };

  // Handle class selection change
  const handleClassChange = (e) => {
    const selected = classes.find((c) => c.class_name === e.target.value);
    setSelectedClass(selected.class_name);
    setSemester(selected.semester);
    setOrganization(selected.organization);

    // Fetch supervisor details for the newly selected class's organization
    fetchSupervisor(volunteerEmail, selected.organization);
  };

  if (loading) return <p>Loading logs...</p>;

  return (
    <div className="log-of-hours-container">
      <h1>Log of Hours</h1>

      <div className="volunteer-info">
        <p><strong>Volunteer:</strong> {volunteerName}</p>
        <p><strong>Supervisor:</strong> {supervisorName}</p>
      </div>

      <div className="class-selector">
        <label htmlFor="class-select">Select Class:</label>
        <select id="class-select" value={selectedClass} onChange={handleClassChange}>
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
                <td>{`${formatTime(log.from_time)} - ${formatTime(log.to_time)}`}</td>
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
