import React, { useContext, useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { AuthContext } from '../AuthContextProvider'; // Access AuthContext

// Register necessary Chart.js components
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const { checkLoginState } = useContext(AuthContext); // Access context functions
  const [user, setUser] = useState(null); // State to store user data
  const [email, setEmail] = useState(null); // State for user email
  const [classes, setClasses] = useState([]); // Classes the user is enrolled in
  const [selectedClass, setSelectedClass] = useState(null); // Selected class for the graph
  const [organization, setOrganization] = useState(''); // Organization for the selected class
  const [requiredHours, setRequiredHours] = useState(0); // Total hours required for the selected class
  const [chartData, setChartData] = useState(null); // State for chart data
  const [loading, setLoading] = useState(true); // State for loading status

  // Fetch the signed-in user's email and their classes
  useEffect(() => {
    const fetchUserClasses = async () => {
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
        setUser(userData.user);

        // Fetch the classes the user is enrolled in
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
          setOrganization(classesData[0].organization); // Default to the organization of the first class
        }
      } catch (error) {
        console.error('Error fetching user classes:', error);
      }
    };

    fetchUserClasses();
  }, []);

  // Fetch the required hours for the selected class
  useEffect(() => {
    if (!selectedClass) return;

    const fetchClassDetails = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/classes/${selectedClass}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch class details');
        }

        const data = await response.json();
        setRequiredHours(data.hour_requirement);
      } catch (error) {
        console.error('Error fetching class details:', error);
      }
    };

    fetchClassDetails();
  }, [selectedClass]);

  // Fetch progress data for the chart
  useEffect(() => {
    if (!email || !selectedClass) return;

    const fetchProgressData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/volunteer/progress/${email}?class_name=${selectedClass}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch progress data');
        }

        const data = await response.json();

        // Prepare cumulative chart data
        let cumulativeHours = 0;
        const labels = data.map((item) => {
          const date = new Date(item.activity_date);
          return new Intl.DateTimeFormat('en-US', {
            month: '2-digit',
            day: '2-digit',
          }).format(date);
        });

        const cumulativeData = data.map((item) => {
          cumulativeHours += parseFloat(item.total_hours); // Accumulate hours
          return Math.min(cumulativeHours, requiredHours); // Cap at required hours
        });

        const formattedData = {
          labels,
          datasets: [
            {
              label: `Cumulative Hours Toward ${requiredHours} for ${selectedClass}`,
              data: cumulativeData,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              pointBackgroundColor: 'rgba(75, 192, 192, 1)',
              pointBorderColor: '#fff',
              fill: true,
              tension: 0.4,
            },
          ],
        };

        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [email, selectedClass, requiredHours]);

  const handleClassChange = (e) => {
    const newClass = e.target.value;
    setSelectedClass(newClass);
    const selectedClassData = classes.find((classItem) => classItem.class_name === newClass);
    setOrganization(selectedClassData?.organization || '');
  };

  if (loading) {
    return <p>You are not enrolled in a course</p>;
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <h2>Welcome, {user?.first_name}</h2>

        {/* Class Selector */}
        <div className="class-selector">
          <label htmlFor="class-select">Select Class:</label>
          <select
            id="class-select"
            value={selectedClass}
            onChange={handleClassChange}
          >
            {classes.map((classItem) => (
              <option key={classItem.class_name} value={classItem.class_name}>
                {classItem.class_name}
              </option>
            ))}
          </select>
        </div>

        {requiredHours > 0 && (
          <p>
            Here are your hours for <strong>{organization}</strong>. Total Hours Required: {requiredHours}
          </p>
        )}
      </div>

      {chartData ? (
        <div className="chart-container" style={{ width: '100%', height: '500px' }}>
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false, // Allow custom height/width
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: `Cumulative Volunteering Hours for ${selectedClass}`,
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Date (MM/DD)',
                  },
                },
                y: {
                  beginAtZero: true,
                  max: requiredHours, // Set Y-axis max to class-required hours
                  title: {
                    display: true,
                    text: 'Cumulative Hours',
                  },
                },
              },
            }}
          />
        </div>
      ) : (
        <p>No progress data available.</p>
      )}
    </div>
  );
};

export default Dashboard;
