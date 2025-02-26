import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

export const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState({});
  const [role, setRole] = useState('');
  const [totalHours, setTotalHours] = useState(0);

  // Sidebar state (NEW)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const serverUrl = process.env.REACT_APP_SERVER_URL;
  const mysqlServerUrl = process.env.REACT_APP_MYSQL_SERVER_URL;

  const checkLoginState = useCallback(async () => {
    try {
      const { data: { loggedIn: logged_in, user } } = await axios.get(`${serverUrl}/auth/logged_in`);
      setLoggedIn(!!logged_in);
  
      if (user) {
        setUser(user);
        const { data } = await axios.get(`${mysqlServerUrl}/api/user/email/${user.email}`);
        setRole(data.role || '');
        setTotalHours(data.user?.total_hours || 0);
      } else {
        setUser({});
        setRole('');
        setTotalHours(0);
      }
    } catch (err) {
      console.error('Error checking login state:', err);
      setLoggedIn(false);
      setUser({});
      setRole('');
      setTotalHours(0);
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
        isSidebarOpen,         // Expose sidebar state
        toggleSidebar,         // Expose toggle function
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
