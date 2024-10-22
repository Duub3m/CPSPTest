import React, { useEffect, useState } from 'react';
import axios from 'axios'; 

const Login = () => {
  const handleLogin = async () => {
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_SERVER_URL}/auth/url`);
      window.location.assign(data.url); // Redirects to Google OAuth consent screen
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div>
      <h3>Login to Google</h3>
      <button onClick={handleLogin}>Login with Google</button>
    </div>
  );
};

export default Login;
