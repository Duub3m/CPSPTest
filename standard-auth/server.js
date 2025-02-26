import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import queryString from 'query-string';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import mysql from 'mysql2/promise'; // Use the promise-based MySQL library

const config = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  redirectUrl: process.env.REACT_APP_AUTH_REDIRECT_URL, // Redirect URL from your .env
  clientUrl: process.env.REACT_APP_CLIENT_URL, // Client URL from your .env
  tokenSecret: process.env.TOKEN_SECRET,
  tokenExpiration: 36000, // Token expiration in seconds
};

// Database Connection
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
    console.log('Connected to MySQL database');
  } catch (err) {
    console.error('Error connecting to MySQL:', err.message);
    process.exit(1); // Exit if the connection fails
  }
})();

const authParams = queryString.stringify({
  client_id: config.clientId,
  redirect_uri: config.redirectUrl,
  response_type: 'code',
  scope: 'openid profile email',
  access_type: 'offline',
  state: 'standard_oauth',
  prompt: 'consent',
});

const getTokenParams = (code) =>
  queryString.stringify({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUrl,
  });

const app = express();

// Middleware setup
app.use(
  cors({
    origin: [config.clientUrl],
    credentials: true,
  })
);
app.use(cookieParser());

// Authentication Middleware
const auth = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    jwt.verify(token, config.tokenSecret);
    return next();
  } catch (err) {
    console.error('Error verifying token:', err);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Routes

// Get Google OAuth URL
app.get('/auth/url', (_, res) => {
  res.json({
    url: `${config.authUrl}?${authParams}`,
  });
});

// Handle Google OAuth Token Exchange
app.get('/auth/token', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ message: 'Authorization code must be provided' });

  try {
    const tokenParam = getTokenParams(code);
    const { data: { id_token } } = await axios.post(`${config.tokenUrl}?${tokenParam}`);
    if (!id_token) throw new Error('ID Token not returned from Google OAuth');

    // Decode the ID token
    const { email, name, picture } = jwt.decode(id_token); // Include picture
    const [firstName, lastName] = name.split(' ');

    // Query the unified Users table
    const [userRows] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);

    if (userRows.length === 0) {
      throw new Error('User not found. Please register first.');
    }

    const user = userRows[0];
    user.picture = picture; // Add picture to the user object

    // Generate a JWT token
    const token = jwt.sign({ user }, config.tokenSecret, { expiresIn: config.tokenExpiration });

    // Set the token as an HTTP-only cookie
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



// Check if User is Logged In
app.get('/auth/logged_in', (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.json({ loggedIn: false });

    const { user } = jwt.verify(token, config.tokenSecret);
    const newToken = jwt.sign({ user }, config.tokenSecret, {
      expiresIn: config.tokenExpiration,
    });

    res.cookie('token', newToken, {
      maxAge: config.tokenExpiration * 1000,
      httpOnly: true,
    });

    res.json({ loggedIn: true, user }); // Ensure `user.picture` is included here
  } catch (err) {
    console.error('Error checking login state:', err.message);
    res.json({ loggedIn: false });
  }
});


// Logout Endpoint
app.post('/auth/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.status(200).json({ message: 'Logged out successfully' });
});

// Protected Route for User Posts
app.get('/user/posts', auth, async (req, res) => {
  try {
    const token = req.cookies.token;
    const { user } = jwt.verify(token, config.tokenSecret);
    res.json({
      name: user.name,
      email: user.email,
      picture: user.picture,
    });
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
