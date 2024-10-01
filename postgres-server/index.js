const express = require('express');
const cors = require('cors'); // Import the 'cors' middleware
const { Pool } = require('pg');

const app = express();
const port = 5001;

// Enable CORS for all routes
app.use(cors());

// PostgreSQL connection 
const pool = new Pool({
  user: 'postgres', //username
  host: 'localhost', //hostname
  database: 'CPSPTest', //database name
  password: 'password', //passwword
  port: 5433,
});

// Tests the connection to PostgreSQL
pool.connect((err) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('Connected to PostgreSQL');
  }
});

// API route to fetch data from dummy_table
app.get('/api/dummydata', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dummy_table');
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).send('Server Error');
  }
});

// Starts the Express server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
