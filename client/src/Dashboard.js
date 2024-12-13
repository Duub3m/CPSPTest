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
import { AuthContext } from './AuthContextProvider'; // Access AuthContext

// Register necessary Chart.js components
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const { checkLoginState } = useContext(AuthContext); // Access context functions
  const [user, setUser] = useState(null); // State to store user data
  const [totalHours, setTotalHours] = useState(0); // State to store total volunteering hours
  const [email, setEmail] = useState(null); // State for user email
  const [loading, setLoading] = useState(true); // State for loading status
  const [chartData, setChartData] = useState(null); // State for chart data
  const [activityData, setActivityData] = useState([]); // Auxiliary array for activity data

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
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/user/email/${email}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        setUser(data.user);
        if (data.role === 'Volunteer') {
          setTotalHours(data.user.total_hours || 0);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [email]);

  // Fetch progress data for the chart
  useEffect(() => {
    if (!email) return;

    const fetchProgressData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/volunteer/progress/${email}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();

        // Prepare chart data
        const labels = data.map((item) => {
          const date = new Date(item.activity_date);
          return new Intl.DateTimeFormat('en-US', {
            month: '2-digit',
            day: '2-digit',
          }).format(date);
        });

        setActivityData(data.map((item) => item.activity)); // Store activity in a separate array

        const formattedData = {
          labels,
          datasets: [
            {
              label: 'Hours Volunteered',
              data: data.map((item) => parseFloat(item.total_hours)),
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
  }, [email]);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <h2>Welcome, {user?.first_name}</h2>
        <p>Total Volunteering Hours: {totalHours}</p>
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
                  text: 'Volunteering Progress Over Time',
                },
                tooltip: {
                  callbacks: {
                    label: (tooltipItem) => {
                      const index = tooltipItem.dataIndex;
                      const activity = activityData[index]; // Access activity from auxiliary array
                      const hours = tooltipItem.raw;
                      return `${hours} Hours - ${activity}`;
                    },
                  },
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
                  title: {
                    display: true,
                    text: 'Total Hours',
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
