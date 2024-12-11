const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const cookieParser = require('cookie-parser');

const app = express();
const port = 5002;

// Allowed origins for CORS
const allowedOrigins = ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies and credentials
  })
);

app.use(express.json()); // Parse JSON request bodies
app.use(cookieParser()); // Parse cookies

// MySQL Connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: 'password', // Replace with your MySQL password
  database: 'CPSPTest', // Replace with your database name
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    process.exit(1); // Exit on connection failure
  }
  console.log('Connected to MySQL');
});

// Routes

// Get user details by email (checks both Supervisors and Volunteers tables)
app.get('/api/user/email/:email', (req, res) => {
  const { email } = req.params;

  // Check Supervisors table first
  const supervisorQuery = `
    SELECT first_name, last_name, email, 'Supervisor' as role 
    FROM Supervisors WHERE email = ?;
  `;

  connection.query(supervisorQuery, [email], (err, supervisorResults) => {
    if (err) {
      console.error('Error fetching supervisor data:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    if (supervisorResults.length > 0) {
      return res.json({ user: supervisorResults[0], role: 'Supervisor' });
    }

    // If not in Supervisors, check Volunteers table
    const volunteerQuery = `
      SELECT first_name, last_name, email, total_hours, 'Volunteer' as role 
      FROM Volunteers WHERE email = ?;
    `;

    connection.query(volunteerQuery, [email], (err, volunteerResults) => {
      if (err) {
        console.error('Error fetching volunteer data:', err.message);
        return res.status(500).json({ message: 'Database query error' });
      }

      if (volunteerResults.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ user: volunteerResults[0], role: 'Volunteer' });
    });
  });
});

// Get all volunteers (for testing/debugging)
app.get('/api/volunteers', (req, res) => {
  const sqlQuery = 'SELECT * FROM Volunteers';
  connection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error fetching volunteers:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }
    res.json(results);
  });
});

// Update total hours for a volunteer by email
app.put('/api/volunteering-hours/email/:email', (req, res) => {
  const { email } = req.params;
  const { total_hours } = req.body;

  const sqlQuery = `
    UPDATE Volunteers
    SET total_hours = ?
    WHERE email = ?;
  `;

  connection.query(sqlQuery, [total_hours, email], (err, results) => {
    if (err) {
      console.error('Error updating total hours:', err.message);
      return res.status(500).json({ message: 'Database update error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    res.json({ message: 'Total hours updated successfully' });
  });
});

// Add a new volunteer (for testing/debugging)
app.post('/api/volunteers', (req, res) => {
  const { first_name, last_name, email } = req.body;

  const sqlQuery = `
    INSERT INTO Volunteers (first_name, last_name, email, total_hours)
    VALUES (?, ?, ?, 0);
  `;

  connection.query(sqlQuery, [first_name, last_name, email], (err, results) => {
    if (err) {
      console.error('Error inserting volunteer:', err.message);
      return res.status(500).json({ message: 'Database insertion error' });
    }

    res.status(201).json({ message: 'Volunteer added successfully', id: results.insertId });
  });
});

// Delete a user by email (checks both Supervisors and Volunteers)
app.delete('/api/user/email/:email', (req, res) => {
  const { email } = req.params;

  // Try deleting from Supervisors first
  const deleteSupervisorQuery = 'DELETE FROM Supervisors WHERE email = ?';

  connection.query(deleteSupervisorQuery, [email], (err, supervisorResults) => {
    if (err) {
      console.error('Error deleting supervisor:', err.message);
      return res.status(500).json({ message: 'Database deletion error' });
    }

    if (supervisorResults.affectedRows > 0) {
      return res.json({ message: 'Supervisor deleted successfully' });
    }

    // If not in Supervisors, try deleting from Volunteers
    const deleteVolunteerQuery = 'DELETE FROM Volunteers WHERE email = ?';

    connection.query(deleteVolunteerQuery, [email], (err, volunteerResults) => {
      if (err) {
        console.error('Error deleting volunteer:', err.message);
        return res.status(500).json({ message: 'Database deletion error' });
      }

      if (volunteerResults.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'Volunteer deleted successfully' });
    });
  });
});

// Add hours to total_hours for a volunteer by email
app.post('/api/volunteering-hours/email/:email', (req, res) => {
  const { email } = req.params;
  const { additional_hours } = req.body;

  if (!additional_hours || additional_hours <= 0) {
    return res.status(400).json({ message: 'Invalid number of hours' });
  }

  const sqlQuery = `
    UPDATE Volunteers
    SET total_hours = total_hours + ?
    WHERE email = ?;
  `;

  connection.query(sqlQuery, [additional_hours, email], (err, results) => {
    if (err) {
      console.error('Error adding hours:', err.message);
      return res.status(500).json({ message: 'Database update error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    res.json({ message: 'Hours added successfully' });
  });
});

// Start the Express server
app.listen(port, () => {
  console.log(`MySQL API Server running on http://localhost:${port}`);
});
