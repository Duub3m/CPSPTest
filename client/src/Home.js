import { useContext } from 'react';
import { AuthContext } from './AuthContextProvider';
import Dashboard from './Dashboard';
import Login from './Login';

const Home = () => {
  const { loggedIn } = useContext(AuthContext);
  return loggedIn ? <Dashboard /> : <Login />;
};

export default Home;