import './App.css';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import AuthContextProvider from './AuthContextProvider';
import Layout from './Layout';
import Home from './Home';
import Callback from './Callback';
import Login from './Login';
import AddHours from './Volunteer/AddHours';
import Dashboard from './Volunteer/Dashboard';
import VolunteerRequests from './Volunteer/Requests';
import VolunteerSupervisorList from './Volunteer/SupervisorList';
import Registration from './Volunteer/Registration';
import LogOfHours from './Volunteer/LogOfHours';
import SupervisorRequests from './Supervisor/Requests';
import SupervisorVolunteerList from './Supervisor/VolunteerList';
import AdminRequests from './Admin/Requests';
import AdminVolunteerList from './Admin/VolunteerList';
import AdminSupervisorList from './Admin/SupervisorList';
import Profile from './Profile';
import Profile2 from './Profile2';
import Messaging from './Messaging';
import Notifications from './Notifications';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/auth/callback', element: <Callback /> },

  // Layout wrapper for pages with the Navbar
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/profile', element: <Profile /> },
      { path: '/Profile2', element: <Profile2 /> },
      { path: '/Messaging', element: <Messaging /> },
      { path: '/Notifications', element: <Notifications /> },
      { path: '/Volunteer/AddHours', element: <AddHours /> },
      { path: '/Volunteer/Dashboard', element: <Dashboard /> },
      { path: '/Volunteer/Requests', element: <VolunteerRequests /> },
      { path: '/Volunteer/SupervisorList', element: <VolunteerSupervisorList /> },
      { path: '/Volunteer/Registration', element: <Registration /> },
      { path: '/Volunteer/LogOfHours', element: <LogOfHours /> },
      { path: '/Supervisor/Requests', element: <SupervisorRequests /> },
      { path: '/Supervisor/VolunteerList', element: <SupervisorVolunteerList /> },
      { path: '/Admin/Requests', element: <AdminRequests /> },
      { path: '/Admin/VolunteerList', element: <AdminVolunteerList /> },
      { path: '/Admin/SupervisorList', element: <AdminSupervisorList /> },
    ],
  },
]);

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <AuthContextProvider>
          <RouterProvider router={router} />
        </AuthContextProvider>
      </header>
    </div>
  );
}

export default App;
