import axios from 'axios';

const Login = () => {
  const serverUrl = process.env.REACT_APP_SERVER_URL;

  const handleLogin = async () => {
    try {
      const { data: { url } } = await axios.get(`${serverUrl}/auth/url`);
      window.location.assign(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h3>Login to Dashboard</h3>
      <button className="btn" onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
