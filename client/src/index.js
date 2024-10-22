import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css';
import Login from './Login'; // Login component
import Profile from './Profile'; // Profile component
import DummyData from './DummyData'; // Dummy data component
import Dashboard from './Dashboard'; // Dashboard component
import Callback from './Callback'; // Callback component
import reportWebVitals from './reportWebVitals';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Define Routes */}
        <Route path="/" element={<Login />} /> {/* Login page */}
        <Route path="/profile" element={<Profile />} /> {/* Profile page */}
        <Route path="/dummydata" element={<DummyData />} /> {/* Dummy data page */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* Dashboard page */}
        <Route path="/auth/callback" element={<Callback />} /> {/* OAuth Callback */}
      </Routes>
    </BrowserRouter>
);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
