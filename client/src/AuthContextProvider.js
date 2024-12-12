import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

export const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(null); // User's login status
  const [user, setUser] = useState(null); // User details
  const [role, setRole] = useState(null); // Role: Supervisor or Volunteer
  const [totalHours, setTotalHours] = useState(0); // Total volunteering hours for volunteers

  const serverUrl = process.env.REACT_APP_SERVER_URL;
  const mysqlServerUrl = process.env.REACT_APP_MYSQL_SERVER_URL;

  // Function to check the logged-in state and fetch user details
  const checkLoginState = useCallback(async () => {
    try {
      const { data: { loggedIn: logged_in, user } } = await axios.get(`${serverUrl}/auth/logged_in`);
      setLoggedIn(logged_in);

      if (user) {
        setUser(user);

        // Fetch additional user data and determine the role
        const { data } = await axios.get(`${mysqlServerUrl}/api/user/email/${user.email}`);
        setRole(data.role); // Role is determined from the backend
        setTotalHours(data.user.total_hours || 0); // Set totalHours for volunteers
      }
    } catch (err) {
      console.error('Error checking login state or fetching user data:', err);
    }
  }, [serverUrl, mysqlServerUrl]);

  useEffect(() => {
    checkLoginState();
  }, [checkLoginState]);

  return (
    <AuthContext.Provider
      value={{
        loggedIn,
        checkLoginState,
        user,
        role,
        totalHours,
        setTotalHours,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
