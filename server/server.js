import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise'; // For promise-based MySQL
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import queryString from 'query-string';

const app = express();
const PORT = process.env.PORT || 5003;

// Configure database connection pool
let db;
(async () => {
  try {
    db = await mysql.createPool({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    console.log('Connected to MySQL database.');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
})();

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Google OAuth Config
const config = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  redirectUrl: process.env.GOOGLE_REDIRECT_URL,
  tokenSecret: process.env.TOKEN_SECRET,
  tokenExpiration: 36000, // 10 hours
};

// Routes

// 1. **Google OAuth: Get Google Auth URL**
app.get('/auth/url', (_, res) => {
  const authParams = queryString.stringify({
    client_id: config.clientId,
    redirect_uri: config.redirectUrl,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    state: 'standard_oauth',
    prompt: 'consent',
  });

  res.json({ url: `${config.authUrl}?${authParams}` });
});

// 2. **Google OAuth: Exchange Code for Token**
app.get('/auth/token', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ message: 'Authorization code is required.' });

  try {
    const tokenParams = queryString.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUrl,
    });

    const { data: { id_token } } = await axios.post(`${config.tokenUrl}?${tokenParams}`);
    if (!id_token) throw new Error('ID Token not returned from Google OAuth');

    const { email, name } = jwt.decode(id_token);
    const [firstName, lastName] = name.split(' ');

    // Insert or update user in database
    const [rows] = await db.query('SELECT * FROM Volunteers WHERE email = ?', [email]);
    if (rows.length === 0) {
      await db.query(
        'INSERT INTO Volunteers (first_name, last_name, email, total_hours) VALUES (?, ?, ?, ?)',
        [firstName, lastName || '', email, 0]
      );
    }

    const [userDetails] = await db.query('SELECT * FROM Volunteers WHERE email = ?', [email]);
    const user = userDetails[0];

    const token = jwt.sign({ user }, config.tokenSecret, { expiresIn: config.tokenExpiration });

    res.cookie('token', token, {
      maxAge: config.tokenExpiration * 1000,
      httpOnly: true,
    });

    res.json({ user });
  } catch (err) {
    console.error('Error during token exchange:', err.message);
    res.status(500).json({ message: 'Server error during authentication' });
  }
});

// 3. **Protected Route: Get User Data**
app.get('/auth/logged_in', (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.json({ loggedIn: false });

    const { user } = jwt.verify(token, config.tokenSecret);
    res.json({ loggedIn: true, user });
  } catch (err) {
    console.error('Error verifying token:', err.message);
    res.json({ loggedIn: false });
  }
});

// 4. **MySQL: Get User by Email**
app.get('/api/volunteering-hours/email/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const [results] = await db.query(
      'SELECT first_name, last_name, email, total_hours FROM Volunteers WHERE email = ?',
      [email]
    );

    if (results.length === 0) return res.status(404).json({ message: 'User not found.' });

    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching user data:', err.message);
    res.status(500).json({ message: 'Database query error.' });
  }
});

// 5. **MySQL: Update User Hours**
app.put('/api/volunteering-hours/email/:email', async (req, res) => {
  const { email } = req.params;
  const { total_hours } = req.body;

  try {
    const [results] = await db.query(
      'UPDATE Volunteers SET total_hours = ? WHERE email = ?',
      [total_hours, email]
    );

    if (results.affectedRows === 0) return res.status(404).json({ message: 'User not found.' });

    res.json({ message: 'Total hours updated successfully.' });
  } catch (err) {
    console.error('Error updating user hours:', err.message);
    res.status(500).json({ message: 'Database update error.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
