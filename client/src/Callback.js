import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Callback() {
  const navigate = useNavigate();
  const called = useRef(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (called.current) return;
        called.current = true;

        // Log the window location to debug the callback URL
        console.log('Window location search:', window.location.search);

        // Send the authorization code to the backend, using the search params (?code=...)
        const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/auth/token${window.location.search}`, {
          withCredentials: true, // ensures credentials (cookies) are sent
        });

        // Check if authentication was successful
        if (res.data.user) {
          console.log('Authenticated user:', res.data.user);

          // After authentication, redirect to the dashboard
          navigate('/dashboard');
        } else {
          console.error('Authentication failed');
          navigate('/');
        }
      } catch (err) {
        // Enhanced logging for detailed error reporting
        console.error('Callback error:', err);
        
        // Log specific details of the Axios error
        if (err.response) {
          // The request was made and the server responded with a status code outside of the 2xx range
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
          console.error('Response headers:', err.response.headers);
        } else if (err.request) {
          // The request was made but no response was received
          console.error('No response received:', err.request);
        } else {
          // Something else happened while setting up the request
          console.error('Axios error message:', err.message);
        }

        // Navigate back to login page on error
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return <div>Authenticating...</div>;
};

export default Callback;
