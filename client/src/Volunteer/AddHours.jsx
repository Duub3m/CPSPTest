import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../AddHours.css';

const AddHours = () => {
  const [formData, setFormData] = useState({
    date: '',
    from: '',
    to: '',
    activity: '',
    class_name: '',
  });

  const [email, setEmail] = useState(null);
  const [supervisorEmail, setSupervisorEmail] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user details and classes
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const userResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const userData = await userResponse.json();

        if (!userData.loggedIn) {
          console.error('User not logged in');
          return;
        }

        setEmail(userData.user.email);

        // Fetch user's enrolled classes
        const classesResponse = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/volunteer-classes/${userData.user.email}`
        );
        if (!classesResponse.ok) {
          throw new Error('Failed to fetch classes');
        }

        const classesData = await classesResponse.json();
        setClasses(classesData);

        if (classesData.length > 0) {
          setFormData((prev) => ({
            ...prev,
            class_name: classesData[0].class_name,
          }));
        }
      } catch (error) {
        console.error('Error fetching user details or classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  // Fetch supervisor email when class changes
  useEffect(() => {
    if (!formData.class_name || !email) return;

    const fetchSupervisorEmail = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/supervisor-email/${email}/${formData.class_name}`
        );
        if (!response.ok) throw new Error('Failed to fetch supervisor email');
        const data = await response.json();
        setSupervisorEmail(data.supervisor_email);
      } catch (error) {
        console.error('Error fetching supervisor email:', error);
        setSupervisorEmail(null);
      }
    };

    fetchSupervisorEmail();
  }, [formData.class_name, email]);

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
    const diff = (toTime - fromTime) / (1000 * 60 * 60);
    return diff > 0 ? diff : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hours = calculateHours();

    if (hours > 0 && email && supervisorEmail && formData.class_name) {
      try {
        const formattedDate = formatDateToISO(formData.date);

        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/hours-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

        if (!response.ok) throw new Error('Failed to submit hours request');

        const result = await response.json();
        alert(result.message);
        setFormData({ date: '', from: '', to: '', activity: '', class_name: '' });
        navigate('/profile2');
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

  // **Handle when user is not enrolled in any class**
  if (classes.length === 0) {
    return <p>You are not enrolled in a course. Please register for a class to add hours.</p>;
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
