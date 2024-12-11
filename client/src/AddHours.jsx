import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddHours.css';

const AddHours = () => {
  const [formData, setFormData] = useState({
    date: '',
    from: '',
    to: '',
    activity: '',
  });

  const [user, setUser] = useState(null); // State to store user data
  const [email, setEmail] = useState(null); // State for user email
  const [loading, setLoading] = useState(true); // State for loading status
  const navigate = useNavigate();

  // Fetch the signed-in user's email
  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include', // Ensure cookies are sent with the request
        });
        const data = await response.json();
        if (data.loggedIn) {
          setEmail(data.user.email); // Set the email from the authenticated user
        } else {
          console.error('User not logged in');
        }
      } catch (error) {
        console.error('Error fetching logged-in user:', error);
      }
    };

    fetchLoggedInUser();
  }, []);

  // Fetch user data once the email is available
  useEffect(() => {
    if (!email) return;

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/volunteering-hours/email/${email}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

    if (hours > 0 && user?.email) {
      try {
        // Make a POST request to add hours to the database
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/volunteering-hours/email/${user.email}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ additional_hours: hours }),
        });

        if (!response.ok) {
          throw new Error('Failed to add hours to the database');
        }

        const updatedData = await response.json();
        alert(updatedData.message); // Display success message
        setFormData({ date: '', from: '', to: '', activity: '' }); // Reset form
        navigate('/profile'); // Redirect back to the profile page
      } catch (error) {
        console.error('Error adding hours:', error);
        alert('An error occurred while adding hours. Please try again.');
      }
    } else {
      alert('Invalid time range or user not logged in.');
    }
  };

  if (loading) {
    return <p>Loading user information...</p>;
  }

  return (
    <div className="add-hours-container">
      <h2>Add Volunteering Hours</h2>
      <form onSubmit={handleSubmit} className="add-hours-form">
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
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default AddHours;
