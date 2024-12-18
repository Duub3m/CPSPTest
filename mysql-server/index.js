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
  user: 'root', 
  password: 'password', 
  database: 'CPSPTest', 
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


// Get approved logs for a specific class
app.get('/api/logs', (req, res) => {
  const { class_name } = req.query;

  const sqlQuery = `
    SELECT date, from_time, to_time, hours, activity
    FROM HoursRequests
    WHERE class_name = ? AND status = 'Approved'
    ORDER BY date ASC;
  `;

  connection.query(sqlQuery, [class_name], (err, results) => {
    if (err) {
      console.error('Error fetching logs:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
  });
});

app.post('/api/volunteer-classes/check-enrollment', (req, res) => {
  const { volunteer_email, course_name, semester } = req.body;

  const sqlQuery = `
    SELECT COUNT(*) AS count
    FROM VolunteerClasses
    WHERE volunteer_email = ? AND class_name = ? AND semester = ?;
  `;

  connection.query(sqlQuery, [volunteer_email, course_name, semester], (err, results) => {
    if (err) {
      console.error('Error checking enrollment:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    const isEnrolled = results[0].count > 0;
    res.json({ isEnrolled });
  });
});

// Check if a volunteer is already enrolled in a course
app.post('/api/volunteer-classes/check-enrollment', (req, res) => {
  const { volunteer_email, course_name, semester } = req.body;

  const sqlQuery = `
    SELECT COUNT(*) AS count
    FROM VolunteerClasses
    WHERE volunteer_email = ? AND class_name = ? AND semester = ?;
  `;

  connection.query(sqlQuery, [volunteer_email, course_name, semester], (err, results) => {
    if (err) {
      console.error('Error checking enrollment:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    const isEnrolled = results[0].count > 0;
    res.json({ isEnrolled });
  });
});


// Get class details by class name
app.get('/api/classes/:class_name', (req, res) => {
  const { class_name } = req.params;

  const sqlQuery = `
    SELECT class_name, hour_requirement
    FROM Classes
    WHERE class_name = ?;
  `;

  connection.query(sqlQuery, [class_name], (err, results) => {
    if (err) {
      console.error('Error fetching class details:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(results[0]);
  });
});

// Routes for Registration Requests

// Get count of pending registration requests for Admins
app.get('/api/admin/requests/count', (req, res) => {
  const sqlQuery = `
    SELECT COUNT(*) AS pending_count
    FROM RegistrationRequests
    WHERE status = 'Pending';
  `;

  connection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error fetching pending registration requests count:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results[0]);
  });
});


// Create a new registration request
app.post('/api/registration-requests', (req, res) => {
  const { volunteer_email, first_name, last_name, semester, year, course_name, organization } = req.body;

  if (!volunteer_email || !first_name || !last_name || !semester || !year || !course_name || !organization) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const sqlQuery = `
    INSERT INTO RegistrationRequests (volunteer_email, first_name, last_name, semester, year, course_name, organization)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;

  connection.query(
    sqlQuery,
    [volunteer_email, first_name, last_name, semester, year, course_name, organization],
    (err, results) => {
      if (err) {
        console.error('Error inserting registration request:', err.message);
        return res.status(500).json({ message: 'Database insertion error' });
      }

      res.status(201).json({ message: 'Registration request submitted successfully', id: results.insertId });
    }
  );
});

// Get all registration requests (Admin only)
app.get('/api/registration-requests', (req, res) => {
  const sqlQuery = `
    SELECT * FROM RegistrationRequests ORDER BY created_at DESC;
  `;

  connection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error fetching registration requests:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
  });
});

// Approve or Reject a registration request (Admin only)
app.put('/api/registration-requests/:id', (req, res) => {
  const { id } = req.params;
  const { status, admin_email } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const updateQuery = `
    UPDATE RegistrationRequests
    SET status = ?, admin_email = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?;
  `;

  connection.query(updateQuery, [status, admin_email, id], (err, results) => {
    if (err) {
      console.error('Error updating registration request status:', err.message);
      return res.status(500).json({ message: 'Database update error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Registration request not found' });
    }

    if (status === 'Approved') {
      // Fetch the request details to insert into VolunteerClasses
      const selectQuery = `
        SELECT volunteer_email, course_name, semester, year, organization
        FROM RegistrationRequests
        WHERE id = ?;
      `;

      connection.query(selectQuery, [id], (err, rows) => {
        if (err) {
          console.error('Error fetching registration request details:', err.message);
          return res.status(500).json({ message: 'Database query error' });
        }

        if (rows.length > 0) {
          const { volunteer_email, course_name, semester, year, organization } = rows[0];

          const insertQuery = `
            INSERT INTO VolunteerClasses (volunteer_email, class_name, semester, year, organization)
            VALUES (?, ?, ?, ?, ?);
          `;

          connection.query(insertQuery, [volunteer_email, course_name, semester, year, organization], (err) => {
            if (err) {
              console.error('Error inserting into VolunteerClasses:', err.message);
              return res.status(500).json({ message: 'Database insertion error' });
            }

            console.log('Request approved and added to VolunteerClasses');
          });
        }
      });
    }

    res.json({ message: `Request ${status.toLowerCase()} successfully` });
  });
});


// Get registration requests for a specific volunteer
app.get('/api/registration-requests/volunteer/:volunteerEmail', (req, res) => {
  const { volunteerEmail } = req.params;

  const sqlQuery = `
    SELECT * FROM RegistrationRequests
    WHERE volunteer_email = ?
    ORDER BY created_at DESC;
  `;

  connection.query(sqlQuery, [volunteerEmail], (err, results) => {
    if (err) {
      console.error('Error fetching registration requests for volunteer:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
  });
});

// Delete a registration request (Optional, for Admin only)
app.delete('/api/registration-requests/:id', (req, res) => {
  const { id } = req.params;

  const sqlQuery = `
    DELETE FROM RegistrationRequests WHERE id = ?;
  `;

  connection.query(sqlQuery, [id], (err, results) => {
    if (err) {
      console.error('Error deleting registration request:', err.message);
      return res.status(500).json({ message: 'Database deletion error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Registration request not found' });
    }

    res.json({ message: 'Registration request deleted successfully' });
  });
});

// Add a volunteer class registration
app.post('/api/volunteer-classes', (req, res) => {
  const { volunteer_email, class_name, semester, year, organization } = req.body;

  const sqlQuery = `
    INSERT INTO VolunteerClasses (volunteer_email, class_name, semester, year, organization)
    VALUES (?, ?, ?, ?, ?);
  `;

  connection.query(
    sqlQuery,
    [volunteer_email, class_name, semester, year, organization],
    (err, results) => {
      if (err) {
        console.error('Error inserting volunteer class registration:', err.message);
        return res.status(500).json({ message: 'Database insertion error' });
      }

      res.status(201).json({ message: 'Volunteer class registration successful', id: results.insertId });
    }
  );
});

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

// Get all classes for a specific volunteer
app.get('/api/volunteer-classes/:email', (req, res) => {
  const { email } = req.params;

  const sqlQuery = `
    SELECT class_name, semester, year, organization
    FROM VolunteerClasses
    WHERE volunteer_email = ?;
  `;

  connection.query(sqlQuery, [email], (err, results) => {
    if (err) {
      console.error('Error fetching volunteer classes:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
  });
});

// Get progress data for a specific volunteer and class
app.get('/api/volunteer/progress/:email', (req, res) => {
  const { email } = req.params;
  const { class_name } = req.query;

  const sqlQuery = `
    SELECT activity, DATE(date) as activity_date, SUM(hours) as total_hours
    FROM HoursRequests
    WHERE volunteer_email = ? AND class_name = ? AND status = 'Approved'
    GROUP BY activity, activity_date
    ORDER BY activity_date ASC;
  `;

  connection.query(sqlQuery, [email, class_name], (err, results) => {
    if (err) {
      console.error('Error fetching volunteer progress:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
  });
});


// Get classes for a specific volunteer
app.get('/api/volunteer/classes/:email', (req, res) => {
  const { email } = req.params;

  const sqlQuery = `
    SELECT class_name FROM VolunteerClasses WHERE volunteer_email = ?;
  `;

  connection.query(sqlQuery, [email], (err, results) => {
    if (err) {
      console.error('Error fetching volunteer classes:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
  });
});


// Get progress data for a specific volunteer
app.get('/api/volunteer/progress/:email', (req, res) => {
  const { email } = req.params;

  const sqlQuery = `
    SELECT activity, class_name, DATE(date) as activity_date, SUM(hours) as total_hours
    FROM HoursRequests
    WHERE volunteer_email = ? AND status = 'Approved'
    GROUP BY activity, class_name, activity_date
    ORDER BY activity_date ASC;
  `;

  connection.query(sqlQuery, [email], (err, results) => {
    if (err) {
      console.error('Error fetching volunteer progress:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
  });
});


//Count pending Requests
app.get('/api/requests/count/:supervisorEmail', (req, res) => {
  const { supervisorEmail } = req.params;

  const sqlQuery = `
    SELECT COUNT(*) AS pending_count
    FROM HoursRequests
    WHERE supervisor_email = ? AND status = 'Pending';
  `;

  connection.query(sqlQuery, [supervisorEmail], (err, results) => {
    if (err) {
      console.error('Error counting pending requests:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    const count = results[0]?.pending_count || 0;
    res.json({ pending_count: count });
  });
});

//fetch requests for a volunteer
app.get('/api/requests/volunteer/:email', (req, res) => {
  const { email } = req.params;

  const sqlQuery = `
    SELECT id, class_name, date, from_time, to_time, activity, hours, status
    FROM HoursRequests
    WHERE volunteer_email = ?;
  `;

  connection.query(sqlQuery, [email], (err, results) => {
    if (err) {
      console.error('Error fetching requests for volunteer:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
  });
});

//Fetch Requests for a Supervisor

app.get('/api/requests/:supervisorEmail', (req, res) => {
  const { supervisorEmail } = req.params;

  const sqlQuery = `
    SELECT 
      hr.id, 
      hr.volunteer_email, 
      v.first_name AS volunteer_first_name, 
      v.last_name AS volunteer_last_name, 
      hr.class_name, 
      hr.date, 
      hr.from_time, 
      hr.to_time, 
      hr.activity, 
      hr.hours, 
      hr.status
    FROM HoursRequests hr
    JOIN Volunteers v ON hr.volunteer_email = v.email
    WHERE hr.supervisor_email = ? AND hr.status = 'Pending';
  `;

  connection.query(sqlQuery, [supervisorEmail], (err, results) => {
    if (err) {
      console.error('Error fetching requests for supervisor:', err.message);
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

//post hour request to the HoursRequest table
app.post('/api/hours-requests', (req, res) => {
  const { volunteer_email, supervisor_email, class_name, date, from_time, to_time, activity, hours, status } = req.body;

  const sqlQuery = `
    INSERT INTO HoursRequests (volunteer_email, supervisor_email, class_name, date, from_time, to_time, activity, hours, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

  connection.query(
    sqlQuery,
    [volunteer_email, supervisor_email, class_name, date, from_time, to_time, activity, hours, status],
    (err, results) => {
      if (err) {
        console.error('Error inserting hours request:', err.message);
        return res.status(500).json({ message: 'Database insertion error' });
      }

      res.status(201).json({ message: 'Hours request submitted successfully', id: results.insertId });
    }
  );
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




// Get user details by email (checks Supervisors, Volunteers, and Admins tables)
app.get('/api/user/email/:email', (req, res) => {
  const { email } = req.params;

  // Check Admins table first
  const adminQuery = `
    SELECT first_name, last_name, email, 'Admin' as role 
    FROM Admins WHERE email = ?;
  `;

  connection.query(adminQuery, [email], (err, adminResults) => {
    if (err) {
      console.error('Error fetching admin data:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    if (adminResults.length > 0) {
      return res.json({ user: adminResults[0], role: 'Admin' });
    }

    // If not in Admins, check Supervisors table
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

        if (volunteerResults.length > 0) {
          return res.json({ user: volunteerResults[0], role: 'Volunteer' });
        }

        // If not found in any table
        return res.status(404).json({ message: 'User not found' });
      });
    });
  });
});

//Get all Admins 
app.get('/api/admins', (req, res) =>{
  const sqlQuery = 'SELECT * From Admins';
  connection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error("Error fetching admins:", err.message);
      return res.status(500).json({ message: 'Database query error'});
    }
    res.json(results);
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

// Get all supervisors (for testing/debugging)
app.get('/api/supervisors', (req, res) => {
  const sqlQuery = 'SELECT * FROM Supervisors';
  connection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error fetching supervisors:', err.message);
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
