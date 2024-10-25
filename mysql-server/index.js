const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); 
const app = express();
const port = 5001;

// Enable CORS for all routes
app.use(cors());

// MySQL connection setup
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', // MySQL username
  password: 'password', // MySQL password
  database: 'CPSPTest', // Database name
});

// Connects to the MySQL database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to MySQL');
});

//Route to fetch data from MySQL
app.get('/api/dummydata', (req, res) => {
  const sqlQuery = 'SELECT * FROM dummy_table'; //SQL Query
  connection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Server Error');
    } else {
      res.json(results); // Sends the data as JSON response
    }
  });
});

// Starts the Express server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
