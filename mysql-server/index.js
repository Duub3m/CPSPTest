const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = 5001;

// Enable CORS for all routes with proper credentials and specific origin
app.use(cors({
  origin: process.env.CLIENT_URL, // Allow only the frontend URL
  credentials: true,              // Allow credentials such as cookies
}));
app.use(cookieParser());

// MySQL connection setup
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'CPSPTest',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Config object for OAuth 2.0
const config = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  redirectUrl: process.env.REDIRECT_URL,
  tokenSecret: process.env.TOKEN_SECRET,
  tokenExpiration: 36000, // Token expiration in seconds (10 hours)
};

// Generate Google OAuth URL
app.get('/auth/url', async (req, res) => {
  const queryString = (await import('query-string')).default;
  const authParams = queryString.stringify({
    client_id: config.clientId,
    redirect_uri: config.redirectUrl,
    response_type: 'code',
    scope: 'openid profile email',
    access_type: 'offline',
    state: 'standard_oauth',
    prompt: 'consent',
  });

  res.json({
    url: `${config.authUrl}?${authParams}`,
  });
});

// Get token parameters
const getTokenParams = (code) => {
  return {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUrl,
  };
};

// Route to handle OAuth callback and exchange code for tokens
app.get('/auth/token', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ message: 'Authorization code must be provided' });

  try {
    const tokenParams = getTokenParams(code);

    // Use `new URLSearchParams` to convert tokenParams into x-www-form-urlencoded format
    const { data } = await axios.post(config.tokenUrl, new URLSearchParams(tokenParams), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Log the token response for debugging
    console.log('Token exchange response:', data);

    const { id_token } = data;
    if (!id_token) return res.status(400).json({ message: 'Auth error: No id_token received' });

    // Decode the token and get user info
    const { email, name, picture } = jwt.decode(id_token);
    const user = { name, email, picture };

    console.log('Decoded user:', user);

    // Sign and set the JWT token as a cookie
    const token = jwt.sign({ user }, config.tokenSecret, { expiresIn: config.tokenExpiration });
    res.cookie('token', token, {
      maxAge: config.tokenExpiration * 1000, // Convert seconds to milliseconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only set secure cookies in production
    });

    // Redirect to frontend (React app) after successful login
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (err) {
    console.error('Error exchanging code for tokens:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to check authentication
const auth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token' });

  try {
    const decoded = jwt.verify(token, config.tokenSecret);
    req.user = decoded.user; // Attach decoded user info to the request
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

// Route to check if user is logged in
app.get('/auth/logged_in', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ loggedIn: false });

  try {
    const { user } = jwt.verify(token, config.tokenSecret);
    res.json({ loggedIn: true, user });
  } catch (err) {
    console.error('Token verification error:', err);
    res.json({ loggedIn: false });
  }
});

// Route to log out user
app.post('/auth/logout', (req, res) => {
  res.clearCookie('token').json({ message: 'Logged out' });
});

// Example route to fetch data from MySQL
app.get('/api/dummydata', (req, res) => {
  const sqlQuery = 'SELECT * FROM dummy_table';
  connection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Server Error');
    } else {
      res.json(results);
    }
  });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
