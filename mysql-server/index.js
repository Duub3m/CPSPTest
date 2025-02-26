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

// Get users based on the logged-in user's role and organization
app.get('/api/users/:email', (req, res) => {
  const userEmail = req.params.email;

  // Get logged-in user details
  const getUserQuery = `SELECT email, role, organization_id FROM Users WHERE email = ?`;

  connection.query(getUserQuery, [userEmail], (err, userResults) => {
    if (err) {
      console.error('Error fetching user details:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { role, organization_id } = userResults[0];

    let sqlQuery;
    let queryParams;

    // Role-based query logic, excluding the logged-in user
    if (role === 'Supervisor' || role === 'Volunteer') {
      // Supervisors and Volunteers: Get Supervisors in the same organization and Admins
      sqlQuery = `
        SELECT email, first_name, last_name, role
        FROM Users
        WHERE ((role = 'Supervisor' AND organization_id = ?) OR role = 'Admin')
        AND email != ?;
      `;
      queryParams = [organization_id, userEmail];
    } else if (role === 'Admin') {
      // Admins: Get all Supervisors and Volunteers, excluding themselves
      sqlQuery = `
        SELECT email, first_name, last_name, role
        FROM Users
        WHERE (role = 'Supervisor' OR role = 'Volunteer')
        AND email != ?;
      `;
      queryParams = [userEmail];
    } else {
      return res.status(403).json({ message: 'Unauthorized role' });
    }

    // Execute query
    connection.query(sqlQuery, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching users:', err.message);
        return res.status(500).json({ message: 'Database query error' });
      }

      res.json(results);
    });
  });
});


app.get('/api/supervisors/by-organization/:organizationId', (req, res) => {
  const { organizationId } = req.params;

  const query = `
    SELECT first_name, last_name, email 
    FROM Users 
    WHERE role = 'Supervisor' AND organization_id = ?`;

  connection.query(query, [organizationId], (err, results) => {
    if (err) {
      console.error('Error fetching supervisors:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }
    res.json(results);
  });
});


// Get the last message between two users
app.get('/api/messages/last/:email1/:email2', (req, res) => {
  const { email1, email2 } = req.params;

  const sqlQuery = `
    SELECT *
    FROM Messages
    WHERE (sender_email = ? AND receiver_email = ?)
       OR (sender_email = ? AND receiver_email = ?)
    ORDER BY created_at DESC
    LIMIT 1;
  `;

  connection.query(sqlQuery, [email1, email2, email2, email1], (err, results) => {
    if (err) {
      console.error('Error fetching last message:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    if (results.length > 0) {
      res.json(results[0]); // Send the last message
    } else {
      res.json({ message: 'No messages found between these users.' });
    }
  });
});




// Get logged hours requests for a supervisor
app.get('/api/hours-requests/supervisor/:supervisorEmail', (req, res) => {
  const { supervisorEmail } = req.params;

  const sqlQuery = `
    SELECT 
      hr.*, 
      u.first_name AS volunteer_first_name, 
      u.last_name AS volunteer_last_name, 
      vc.class_name
    FROM HoursRequests hr
    JOIN VolunteerClasses vc 
      ON hr.class_name = vc.class_name 
      AND hr.volunteer_email = vc.volunteer_email
    JOIN Users u 
      ON hr.volunteer_email = u.email
    WHERE hr.supervisor_email = ? 
      AND u.role = 'Volunteer'
    ORDER BY hr.created_at DESC;
  `;

  connection.query(sqlQuery, [supervisorEmail], (err, results) => {
    if (err) {
      console.error('Error fetching hours requests for supervisor:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
  });
});



// Get supervisor email for a volunteer's class and organization
app.get('/api/supervisor-email/:volunteerEmail/:className', (req, res) => {
  const { volunteerEmail, className } = req.params;

  const sqlQuery = `
    SELECT sv.supervisor_email
    FROM SupervisorVolunteer sv
    JOIN VolunteerClasses vc ON sv.volunteer_email = vc.volunteer_email AND sv.organization = vc.organization
    WHERE vc.volunteer_email = ? AND vc.class_name = ?;
  `;

  connection.query(sqlQuery, [volunteerEmail, className], (err, results) => {
    if (err) {
      console.error('Error fetching supervisor email:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No supervisor found for the selected class and organization' });
    }

    res.json({ supervisor_email: results[0].supervisor_email });
  });
});

// Get supervisor details for a volunteer and organization
app.get('/api/supervisor-details/:volunteerEmail/:organization', (req, res) => {
  const { volunteerEmail, organization } = req.params;

  const sqlQuery = `
    SELECT s.first_name, s.last_name
    FROM SupervisorVolunteer sv
    JOIN Supervisors s ON sv.supervisor_email = s.email
    WHERE sv.volunteer_email = ? AND sv.organization = ?;
  `;

  connection.query(sqlQuery, [volunteerEmail, organization], (err, results) => {
    if (err) {
      console.error('Error fetching supervisor details:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No supervisor found for the volunteer in this organization' });
    }

    res.json(results[0]);
  });
});

// Create a new notification
app.post('/api/notifications', (req, res) => {
  const { receiver_email, sender_email, notification_type, message } = req.body;

  // Check for missing fields
  if (!receiver_email || !sender_email || !notification_type || !message) {
    console.error('Missing fields in notification:', { receiver_email, sender_email, notification_type, message });
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sqlQuery = `
    INSERT INTO Notifications (receiver_email, sender_email, notification_type, message)
    VALUES (?, ?, ?, ?);
  `;

  connection.query(sqlQuery, [receiver_email, sender_email, notification_type, message], (err) => {
    if (err) {
      console.error('Error creating notification:', err.message);
      return res.status(500).json({ message: 'Database insertion error' });
    }
    res.status(201).json({ message: 'Notification created successfully' });
  });
});

// Fetch unread notification count for a user
app.get('/api/notifications/count/:email', (req, res) => {
  const { email } = req.params;

  const sqlQuery = `
    SELECT COUNT(*) AS unread_count
    FROM Notifications
    WHERE receiver_email = ? AND is_read = FALSE;
  `;

  connection.query(sqlQuery, [email], (err, results) => {
    if (err) {
      console.error('Error fetching notification count:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }
    res.json({ unread_count: results[0].unread_count });
  });
});

// Fetch unread notifications for a user
app.get('/api/notifications/:email', (req, res) => {
  const { email } = req.params;

  const sqlQuery = `
    SELECT id, receiver_email, sender_email, notification_type, message, is_read, created_at
    FROM Notifications
    WHERE receiver_email = ? AND is_read = FALSE
    ORDER BY created_at DESC;
  `;

  connection.query(sqlQuery, [email], (err, results) => {
    if (err) {
      console.error('Error fetching notifications:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }
    res.json(results);
  });
});

// Mark a notification as read
app.put('/api/notifications/read/:id', (req, res) => {
  const { id } = req.params;

  const sqlQuery = `
    UPDATE Notifications
    SET is_read = TRUE
    WHERE id = ?;
  `;

  connection.query(sqlQuery, [id], (err, results) => {
    if (err) {
      console.error('Error marking notification as read:', err.message);
      return res.status(500).json({ message: 'Database update error' });
    }
    res.json({ message: 'Notification marked as read' });
  });
});


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
  const { volunteer_email, first_name, last_name, semester, year, course_name, organization, supervisor_email } = req.body;

  const sqlQuery = `
    INSERT INTO RegistrationRequests (volunteer_email, first_name, last_name, semester, year, course_name, organization, supervisor_email, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending Supervisor Approval');
  `;

  connection.query(sqlQuery, [
    volunteer_email,
    first_name,
    last_name,
    semester,
    year,
    course_name,
    organization,
    supervisor_email,
  ], (err) => {
    if (err) {
      console.error('Error creating registration request:', err.message);
      return res.status(500).json({ message: 'Database insertion error' });
    }

    // Respond with success once the request is added to the database
    res.status(201).json({ message: 'Registration request submitted successfully.' });
  });
});


app.put('/api/supervisor/requests/:id/approval', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Pending Admin Approval', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const sqlQuery = `
    UPDATE RegistrationRequests
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'Pending Supervisor Approval';
  `;

  connection.query(sqlQuery, [status, id], (err, results) => {
    if (err) {
      console.error('Error updating supervisor request:', err.message);
      return res.status(500).json({ message: 'Database update error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Request not found or already processed.' });
    }

    res.json({ message: `Request ${status === 'Pending Admin Approval' ? 'approved' : 'rejected'} successfully.` });
  });
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

// Approve a registration request and add to SupervisorVolunteer table
app.put('/api/registration-requests/supervisor/:supervisorEmail', (req, res) => {
  const { supervisorEmail } = req.params;
  const { status, volunteer_email } = req.body;

  if (!['Pending Admin Approval', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  console.log('Supervisor Email:', supervisorEmail);
  console.log('Status:', status);
  console.log('Volunteer Email:', volunteer_email);

  const updateRequestQuery = `
    UPDATE RegistrationRequests
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE volunteer_email = ? AND supervisor_email = ?;
  `;

  connection.query(updateRequestQuery, [status, volunteer_email, supervisorEmail], (err, results) => {
    if (err) {
      console.error('Error updating registration request status:', err.message);
      return res.status(500).json({ message: 'Database update error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Registration request not found' });
    }

    if (status === 'Pending Admin Approval') {
      const selectOrganizationQuery = `
        SELECT organization
        FROM RegistrationRequests
        WHERE volunteer_email = ? AND supervisor_email = ?;
      `;

      connection.query(selectOrganizationQuery, [volunteer_email, supervisorEmail], (err, rows) => {
        if (err) {
          console.error('Error fetching organization:', err.message);
          return res.status(500).json({ message: 'Database query error' });
        }

        if (rows.length === 0) {
          return res.status(404).json({ message: 'No matching registration request found' });
        }

        const { organization } = rows[0];

        const insertSupervisorVolunteerQuery = `
          INSERT INTO SupervisorVolunteer (supervisor_email, volunteer_email, organization)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE organization = VALUES(organization);
        `;

        connection.query(insertSupervisorVolunteerQuery, [supervisorEmail, volunteer_email, organization], (err) => {
          if (err) {
            console.error('Error inserting into SupervisorVolunteer:', err.message);
            return res.status(500).json({ message: 'Database insertion error' });
          }

          res.json({ message: 'Request approved, and details added to SupervisorVolunteer table.' });
        });
      });
    } else {
      res.json({ message: 'Request rejected successfully.' });
    }
  });
});




// Get registration requests for a specific supervisor
app.get('/api/registration-requests/supervisor/:supervisorEmail', (req, res) => {
  const { supervisorEmail } = req.params;

  const sqlQuery = `
    SELECT * FROM RegistrationRequests
    WHERE supervisor_email = ? AND status = 'Pending Supervisor Approval'
    ORDER BY created_at DESC;
  `;

  connection.query(sqlQuery, [supervisorEmail], (err, results) => {
    if (err) {
      console.error('Error fetching registration requests for supervisor:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
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
    SELECT u.first_name, u.last_name, u.email, u.total_hours
    FROM HoursRequests hr
    JOIN Users u ON hr.volunteer_email = u.email
    WHERE hr.supervisor_email = ? AND u.role = 'Volunteer'
    GROUP BY u.email;
  `;

  connection.query(sqlQuery, [supervisorEmail], (err, results) => {
    if (err) {
      console.error('Error fetching volunteers for supervisor:', err.message);
      return res.status(500).json({ message: 'Database query error' });
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
    FROM HoursRequests hr
    JOIN Users u ON hr.supervisor_email = u.email
    WHERE hr.supervisor_email = ? AND hr.status = 'Pending';
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

// Fetch Registration Requests for a Supervisor
app.get('/api/registration-requests/supervisor/:supervisorEmail', (req, res) => {
  const { supervisorEmail } = req.params;

  const sqlQuery = `
    SELECT 
      rr.id,
      rr.volunteer_email,
      rr.course_name,
      rr.organization,
      rr.semester,
      rr.year,
      rr.status,
      u.first_name AS volunteer_first_name,
      u.last_name AS volunteer_last_name
    FROM RegistrationRequests rr
    JOIN Users u ON rr.volunteer_email = u.email
    WHERE rr.supervisor_email = ? AND rr.status = 'Pending Supervisor Approval';
  `;

  connection.query(sqlQuery, [supervisorEmail], (err, results) => {
    if (err) {
      console.error('Error fetching registration requests:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
  });
});


// Fetch Requests for a Supervisor
app.get('/api/requests/:supervisorEmail', (req, res) => {
  const { supervisorEmail } = req.params;

  const sqlQuery = `
    SELECT 
      hr.id, 
      hr.volunteer_email, 
      hr.class_name, 
      hr.date, 
      hr.from_time, 
      hr.to_time, 
      hr.activity, 
      hr.hours, 
      hr.status, 
      hr.created_at,
      u.first_name AS volunteer_first_name, 
      u.last_name AS volunteer_last_name
    FROM HoursRequests hr
    JOIN Users u ON hr.volunteer_email = u.email
    WHERE hr.supervisor_email = ? 
      AND hr.status = 'Pending' 
      AND u.role = 'Volunteer';
  `;

  connection.query(sqlQuery, [supervisorEmail], (err, results) => {
    if (err) {
      console.error('Error fetching requests for supervisor:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    res.json(results);
  });
});


app.put('/api/requests/supervisor/:email', (req, res) => {
  const { email } = req.params; // Supervisor's email
  const { status, request_id } = req.body; // Request ID and new status

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const updateQuery = `
    UPDATE HoursRequests
    SET status = ?
    WHERE id = ? AND supervisor_email = ?;
  `;

  connection.query(updateQuery, [status, request_id, email], (err, results) => {
    if (err) {
      console.error('Error updating request status:', err.message);
      return res.status(500).json({ message: 'Database update error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    if (status === 'Approved') {
      // Fetch the approved hours and update the volunteer's total hours
      const getRequestQuery = `
        SELECT volunteer_email, hours
        FROM HoursRequests
        WHERE id = ?;
      `;

      connection.query(getRequestQuery, [request_id], (err, rows) => {
        if (err) {
          console.error('Error fetching request for hours update:', err.message);
          return res.status(500).json({ message: 'Database query error' });
        }

        if (rows.length > 0) {
          const { volunteer_email, hours } = rows[0];

          const updateUserQuery = `
            UPDATE Users
            SET total_hours = total_hours + ?
            WHERE email = ? AND role = 'Volunteer';
          `;

          connection.query(updateUserQuery, [hours, volunteer_email], (err) => {
            if (err) {
              console.error('Error updating volunteer hours:', err.message);
              return res.status(500).json({ message: 'Database update error' });
            }

            res.json({ message: `Request ${status.toLowerCase()} successfully.` });
          });
        } else {
          res.json({ message: `Request ${status.toLowerCase()} successfully.` });
        }
      });
    } else {
      res.json({ message: `Request ${status.toLowerCase()} successfully.` });
    }
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




// Get user details by email 
app.get('/api/user/email/:email', (req, res) => {
  const { email } = req.params;

  const sqlQuery = `
    SELECT id, email, first_name, last_name, role, total_hours
    FROM Users
    WHERE email = ?;
  `;

  connection.query(sqlQuery, [email], (err, results) => {
    if (err) {
      console.error('Error fetching user:', err.message);
      return res.status(500).json({ message: 'Database query error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(results[0]);
  });
});


// Get all Admins 
app.get('/api/admins', (req, res) => {
  const sqlQuery = 'SELECT * FROM Users WHERE role = "Admin"';
  
  connection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error("Error fetching admins:", err.message);
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
    UPDATE Users
    SET total_hours = ?
    WHERE email = ? AND role = 'Volunteer';
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

// Add hours to total_hours for a volunteer by email
app.post('/api/volunteering-hours/email/:email', (req, res) => {
  const { email } = req.params;
  const { additional_hours } = req.body;

  if (!additional_hours || additional_hours <= 0) {
    return res.status(400).json({ message: 'Invalid number of hours' });
  }

  const sqlQuery = `
    UPDATE Users
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
