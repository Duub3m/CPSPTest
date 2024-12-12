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

//Messaging
// Add a new message
app.post('/api/messages', (req, res) => {
  const { sender_email, receiver_email, message } = req.body;

  if (!sender_email || !receiver_email || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const sqlQuery = `
    INSERT INTO Messages (sender_email, receiver_email, message)
    VALUES (?, ?, ?);
  `;

  connection.query(sqlQuery, [sender_email, receiver_email, message], (err, results) => {
    if (err) {
      console.error('Error inserting message:', err.message);
      return res.status(500).json({ message: 'Database insertion error' });
    }

    res.status(201).json({ message: 'Message sent successfully', id: results.insertId });
  });
});

// Get all messages between two users
app.get('/api/messages/:user1/:user2', (req, res) => {
  const { user1, user2 } = req.params;

  const sqlQuery = `
    SELECT id, sender_email, receiver_email, message, created_at
    FROM Messages
    WHERE (sender_email = ? AND receiver_email = ?)
       OR (sender_email = ? AND receiver_email = ?)
    ORDER BY created_at ASC;
  `;

  connection.query(sqlQuery, [user1, user2, user2, user1], (err, results) => {
    if (err) {
      console.error('Error fetching messages:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
  });
});

// Delete a message 
app.delete('/api/messages/:id', (req, res) => {
  const { id } = req.params;

  const sqlQuery = `
    DELETE FROM Messages WHERE id = ?;
  `;

  connection.query(sqlQuery, [id], (err, results) => {
    if (err) {
      console.error('Error deleting message:', err.message);
      return res.status(500).json({ message: 'Database deletion error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message deleted successfully' });
  });
});

// Get a list of volunteers associated with a specific supervisor
app.get('/api/supervisor/volunteers/:supervisorEmail', (req, res) => {
  const { supervisorEmail } = req.params;

  const sqlQuery = `
    SELECT v.first_name, v.last_name, v.email, v.total_hours
    FROM SupervisorVolunteer sv
    INNER JOIN Volunteers v ON sv.volunteer_email = v.email
    WHERE sv.supervisor_email = ?;
  `;

  connection.query(sqlQuery, [supervisorEmail], (err, results) => {
    if (err) {
      console.error('Error fetching volunteers for supervisor:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No volunteers found for this supervisor' });
    }

    res.json(results);
  });
});

//fetch requests for a volunteer
app.get('/api/requests/volunteer/:email', (req, res) => {
  const { email } = req.params;

  const sqlQuery = `
    SELECT id, date, from_time, to_time, activity, hours, status
    FROM HoursRequests
    WHERE volunteer_email = ?;
  `;

  connection.query(sqlQuery, [email], (err, results) => {
    if (err) {
      console.error('Error fetching requests:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
  });
});


app.get('/api/requests/:supervisorEmail', (req, res) => {
  const { supervisorEmail } = req.params;

  const sqlQuery = `
    SELECT id, volunteer_email, date, from_time, to_time, activity, hours, status
    FROM HoursRequests
    WHERE supervisor_email = ? AND status = 'Pending';
  `;

  connection.query(sqlQuery, [supervisorEmail], (err, results) => {
    if (err) {
      console.error('Error fetching requests:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
  });
});


app.put('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const updateQuery = `
    UPDATE HoursRequests
    SET status = ?
    WHERE id = ?;
  `;

  connection.query(updateQuery, [status, id], async (err, results) => {
    if (err) {
      console.error('Error updating request status:', err.message);
      return res.status(500).json({ message: 'Database update error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (status === 'Approved') {
      // Add hours to the volunteer's total
      const getRequestQuery = `SELECT volunteer_email, hours FROM HoursRequests WHERE id = ?;`;
      connection.query(getRequestQuery, [id], (err, rows) => {
        if (err) {
          console.error('Error fetching request for hours update:', err.message);
          return res.status(500).json({ message: 'Database query error' });
        }

        if (rows.length > 0) {
          const { volunteer_email, hours } = rows[0];

          const updateVolunteerQuery = `
            UPDATE Volunteers
            SET total_hours = total_hours + ?
            WHERE email = ?;
          `;

          connection.query(updateVolunteerQuery, [hours, volunteer_email], (err) => {
            if (err) {
              console.error('Error updating volunteer hours:', err.message);
              return res.status(500).json({ message: 'Database update error' });
            }
          });
        }
      });
    }

    res.json({ message: `Request ${status.toLowerCase()} successfully` });
  });
});



app.get('/api/supervisor/:email', (req, res) => {
  const { email } = req.params;

  const sqlQuery = `
    SELECT supervisor_email 
    FROM SupervisorVolunteer 
    WHERE volunteer_email = ?;
  `;

  connection.query(sqlQuery, [email], (err, results) => {
    if (err) {
      console.error('Error fetching supervisor email:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No supervisor found for this volunteer' });
    }

    res.json(results[0]);
  });
});


// Get supervisor emails and details for a specific volunteer email
app.get('/api/supervisors/by-volunteer/:volunteerEmail', (req, res) => {
  const { volunteerEmail } = req.params;

  const sqlQuery = `
    SELECT sv.id, sv.supervisor_email, s.first_name AS supervisor_first_name, 
           s.last_name AS supervisor_last_name, sv.created_at
    FROM SupervisorVolunteer sv
    INNER JOIN Supervisors s ON sv.supervisor_email = s.email
    WHERE sv.volunteer_email = ?;
  `;

  connection.query(sqlQuery, [volunteerEmail], (err, results) => {
    if (err) {
      console.error('Error fetching supervisors for volunteer:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No supervisors found for this volunteer' });
    }

    res.json(results);
  });
});


//post hour request to the HoursRequest table
app.post('/api/hours-requests', (req, res) => {
  const { volunteer_email, supervisor_email, date, from_time, to_time, activity, hours, status } = req.body;

  const sqlQuery = `
    INSERT INTO HoursRequests (volunteer_email, supervisor_email, date, from_time, to_time, activity, hours, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `;

  connection.query(
    sqlQuery,
    [volunteer_email, supervisor_email, date, from_time, to_time, activity, hours, status],
    (err, results) => {
      if (err) {
        console.error('Error inserting hours request:', err.message);
        return res.status(500).json({ message: 'Database insertion error' });
      }

      res.status(201).json({ message: 'Hours request submitted successfully' });
    }
  );
});

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
