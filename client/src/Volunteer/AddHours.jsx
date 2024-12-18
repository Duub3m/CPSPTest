import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../AddHours.css';

const AddHours = () => {
  const [formData, setFormData] = useState({
    date: '',
    from: '',
    to: '',
    activity: '',
    class_name: '', // New field for class selection
  });

  const [email, setEmail] = useState(null); // State for user email
  const [supervisorEmail, setSupervisorEmail] = useState(null); // State for supervisor email
  const [classes, setClasses] = useState([]); // List of classes
  const [loading, setLoading] = useState(true); // State for loading status
  const navigate = useNavigate();

  // Fetch the signed-in user's email, supervisor email, and classes
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        // Fetch logged-in user's email
        const userResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const userData = await userResponse.json();

        if (!userData.loggedIn) {
          console.error('User not logged in');
          return;
        }

        setEmail(userData.user.email);

        // Fetch supervisor email for the volunteer
        const supervisorResponse = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/supervisor/${userData.user.email}`
        );
        if (!supervisorResponse.ok) {
          throw new Error('Failed to fetch supervisor email');
        }
        const supervisorData = await supervisorResponse.json();
        setSupervisorEmail(supervisorData.supervisor_email);

        // Fetch classes for the volunteer
        const classesResponse = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/volunteer-classes/${userData.user.email}`
        );
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch classes');
        }
        const classesData = await classesResponse.json();
        setClasses(classesData); // Populate the dropdown with classes
      } catch (error) {
        console.error('Error fetching user details or classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const formatDateToISO = (mmdd) => {
    const [month, day] = mmdd.split('/');
    const year = new Date().getFullYear();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const calculateHours = () => {
    const fromTime = new Date(`01/01/2023 ${formData.from}`);
    const toTime = new Date(`01/01/2023 ${formData.to}`);
    const diff = (toTime - fromTime) / (1000 * 60 * 60); // Convert ms to hours
    return diff > 0 ? diff : 0; // Prevent negative values
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hours = calculateHours();

    if (hours > 0 && email && supervisorEmail && formData.class_name) {
      try {
        // Convert date to YYYY-MM-DD format
        const formattedDate = formatDateToISO(formData.date);

        // Make a POST request to submit the request for hours
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/hours-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            volunteer_email: email,
            supervisor_email: supervisorEmail,
            class_name: formData.class_name,
            date: formattedDate,
            from_time: formData.from,
            to_time: formData.to,
            activity: formData.activity,
            hours,
            status: 'Pending',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit hours request');
        }

        const result = await response.json();
        alert(result.message); // Display success message
        setFormData({ date: '', from: '', to: '', activity: '', class_name: '' }); // Reset form
        navigate('/profile'); // Redirect back to the profile page
      } catch (error) {
        console.error('Error submitting hours request:', error);
        alert('An error occurred while submitting the request. Please try again.');
      }
    } else {
      alert('Invalid input or missing information. Please check your entries.');
    }
  };

  if (loading) {
    return <p>Loading user, supervisor, and class information...</p>;
  }

  return (
    <div className="add-hours-container">
      <h2>Submit Hours Request</h2>
      <form onSubmit={handleSubmit} className="add-hours-form">
      <div>
          <label>Class</label>
          <select
            name="class_name"
            value={formData.class_name}
            onChange={handleChange}
            required
          >
            <option value="">Select a Class</option>
            {classes.map((cls) => (
              <option key={cls.class_name} value={cls.class_name}>
                {cls.class_name} - {cls.class_description}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Date</label>
          <input
            type="text"
            name="date"
            value={formData.date}
            onChange={handleChange}
            placeholder="MM/DD"
            required
          />
        </div>
        <div>
          <label>From</label>
          <input
            type="time"
            name="from"
            value={formData.from}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>To</label>
          <input
            type="time"
            name="to"
            value={formData.to}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Activity</label>
          <textarea
            name="activity"
            value={formData.activity}
            onChange={handleChange}
            placeholder="Describe the activity"
            required
          />
        </div>
        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
};

export default AddHours;
