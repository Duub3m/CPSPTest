import axios from 'axios';
import './Login.css';
import helloImage from './assets/images/Single_Sign_On_Login_Hello.jpg';
import uaLogo from './assets/images/UA_logo3.gif';

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
    <div className="login-page">
      <img src={helloImage} alt="Hello" className="hello-image" />
      <img src={uaLogo} alt="University at Albany Logo" className="ua-logo" />

      <div className="login-box">
        <input type="text" placeholder="NetID" />
        <input type="password" placeholder="Password" />
        <button onClick={handleLogin}>Sign in</button>
      </div>

      <div className="login-links">
        <a href="#">Set Password</a> | <a href="#">Reset Password</a> | <a href="#">Get Duo Bypass Code</a> | <a href="#">Need Help?</a> | <a href="#">Scheduled Maintenance</a>
      </div>

      <p className="disclaimer">
        All University IT systems and data are for authorized use only. As an authorized user, you agree to protect and maintain the security, integrity and confidentiality of University systems and data consistent with all applicable policies and legal requirements. Unauthorized use may result in disciplinary action, civil or criminal penalties.
      </p>
    </div>
  );
};

export default Login;
