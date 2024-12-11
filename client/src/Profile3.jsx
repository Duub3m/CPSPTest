import React, { useEffect, useState } from 'react';

const Profile = () => {
  const [userData, setUserData] = useState(null); // State to store user data
  const [loading, setLoading] = useState(true); // State for loading status
  const email = "enehdubem@gmail.com"; // Replace with dynamic email if needed

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/volunteering-hours/email/${email}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };    

    fetchUserData();
  }, [email]);

  if (loading) {
    return <p>Loading profile...</p>;
  }

  

  return (
    <div>
      <h1>Profile</h1>
      <div>
        <p><strong>First Name:</strong> {userData?.first_name || 'N/A'}</p>
        <p><strong>Last Name:</strong> {userData?.last_name || 'N/A'}</p>
        <p><strong>Email:</strong> {userData?.email || 'N/A'}</p>
        <p><strong>Total Volunteering Hours:</strong> {userData?.total_hours}</p>
      </div>
    </div>
  );
};

export default Profile;
