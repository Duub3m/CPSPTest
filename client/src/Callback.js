import { useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from './AuthContextProvider';

const Callback = () => {
  const called = useRef(false);
  const { checkLoginState } = useContext(AuthContext);
  const navigate = useNavigate();

  const serverUrl = process.env.REACT_APP_SERVER_URL;

  useEffect(() => {
    (async () => {
      if (!called.current) {
        called.current = true;
        try {
          await axios.get(`${serverUrl}/auth/token${window.location.search}`);
          checkLoginState();
          navigate('/profile2'); // Redirect to Profile page
        } catch (err) {
          console.error(err);
          navigate('/login'); // Redirect to login on error
        }
      }
    })();
  }, [checkLoginState, navigate, serverUrl]);

  return null;
};

export default Callback;