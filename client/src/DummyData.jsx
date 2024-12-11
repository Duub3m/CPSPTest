import React, { useEffect, useState } from 'react';
import axios from 'axios'; 

const DummyData = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetches data from your backend
    axios.get('http://localhost:5001/api/dummydata') // This is the API route from your Express server
      .then((response) => {
        setData(response.data); // Sets the fetched data to the state
      })
      .catch((error) => { //catches and error(if any)
        console.error('Error fetching data:', error);
      });
  }, []);

  return (//returns the dummy data
    <div>
      <h1>Dummy Data</h1>
      <ul>
        {data.map((item) => (
          <li key={item.id}>
            {item.name} - {item.email}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DummyData;
