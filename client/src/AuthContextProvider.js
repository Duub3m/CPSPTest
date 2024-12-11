import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

export const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(null);
  const [user, setUser] = useState(null);
  const [totalHours, setTotalHours] = useState(0); // State for total hours

  const serverUrl = process.env.REACT_APP_MYSQL_SERVER_URL;

  const checkLoginState = useCallback(async () => {
    try {
      const { data: { loggedIn: logged_in, user } } = await axios.get(`${serverUrl}/auth/logged_in`);
      setLoggedIn(logged_in);
      if (user) {
        setUser(user);
        setTotalHours(user.total_hours || 0); // Initialize totalHours from user data
      }
    } catch (err) {
      console.error(err);
    }
  }, [serverUrl]);

  useEffect(() => {
    checkLoginState();
  }, [checkLoginState]);

  return (
    <AuthContext.Provider value={{ loggedIn, checkLoginState, user, totalHours, setTotalHours }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
