import React, { useState, useEffect, useContext } from 'react';
import './Profile2.css';
import { AuthContext } from './AuthContextProvider';

const Profile2 = () => {
  const { user, role } = useContext(AuthContext);
  const [profilePicture, setProfilePicture] = useState('');
  const [about, setAbout] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [logs, setLogs] = useState([]);
  const [organization, setOrganization] = useState('');
  const [supervisor, setSupervisor] = useState('No supervisor assigned');
  const [selectedCourse, setSelectedCourse] = useState('');

  // Fetch the profile picture
  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.loggedIn && data.user?.picture) {
          setProfilePicture(data.user.picture);
        } else {
          setProfilePicture('https://example.com/default-profile.png');
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
        setProfilePicture('https://example.com/default-profile.png');
      }
    };

    fetchProfilePicture();
  }, []);

  // Fetch supervisor info
  const fetchSupervisor = async (email, organization) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/supervisor-details/${email}/${organization}`
      );
      const data = await response.json();

      if (response.ok && data) {
        setSupervisor(`${data.first_name} ${data.last_name}`);
      } else {
        setSupervisor('No supervisor assigned');
      }
    } catch (error) {
      console.error('Error fetching supervisor details:', error);
      setSupervisor('Error fetching supervisor');
    }
  };

  // Fetch user courses and logs
  useEffect(() => {
    const fetchData = async () => {
      if (role === 'Volunteer') {
        const classesResponse = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/volunteer-classes/${user.email}`
        );
        const classesData = await classesResponse.json();
        setCourses(classesData);

        if (classesData.length > 0) {
          const defaultCourse = classesData[0];
          setSelectedCourse(defaultCourse.class_name);
          setOrganization(defaultCourse.organization);
          fetchLogs(defaultCourse.class_name);
          fetchSupervisor(user.email, defaultCourse.organization);
        }
      }
    };

    fetchData();
  }, [user.email, role]);

  const fetchLogs = async (className) => {
    try {
      const logsResponse = await fetch(
        `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/logs?class_name=${className}`
      );
      const logsData = await logsResponse.json();
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleCourseChange = (e) => {
    const selected = courses.find((c) => c.class_name === e.target.value);
    setSelectedCourse(selected.class_name);
    setOrganization(selected.organization);
    fetchLogs(selected.class_name);
    fetchSupervisor(user.email, selected.organization);
  };

  const saveAboutMe = async () => {
    try {
      await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/about/${user.email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ about }),
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving About Me:', error);
    }
  };

  return (
    <div>
      <div className="profile-header">
        <div className="profile-image-wrapper">
          <img
            className="profile-image"
            src={profilePicture}
            alt={`${user?.first_name || 'User'}'s profile`}
          />
        </div>
        <div className="profile-details">
          <h1>{`${user.first_name} ${user.last_name} (${role})`}</h1>
          {isEditing ? (
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="about-edit"
            />
          ) : (
            <p>{about || 'No information provided.'}</p>
          )}
          <button onClick={() => (isEditing ? saveAboutMe() : setIsEditing(true))}>
            {isEditing ? 'Save' : 'Edit About Me'}
          </button>
        </div>
      </div>

      <div className="profile-container">
        <div className="profile-bottom">
          {role === 'Volunteer' && (
            <div className="profile-card">
              <h2>Enrolled Courses</h2>
              <select value={selectedCourse} onChange={handleCourseChange}>
                {courses.map((course) => (
                  <option key={course.class_name} value={course.class_name}>
                    {course.class_name} - {course.semester} {course.year}
                  </option>
                ))}
              </select>
              <p><i className="location-icon"></i> Organization: {organization}</p>
              <p><i className="job-icon"></i> Supervisor: {supervisor}</p>
            </div>
          )}

          {role === 'Volunteer' && (
            <div className="profile-card">
              <h2>Total Approved Hours</h2>
              <p>{logs.reduce((sum, log) => sum + log.hours, 0).toFixed(2)} hours</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile2;
