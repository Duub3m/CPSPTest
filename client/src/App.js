import './App.css';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import AuthContextProvider from './AuthContextProvider';
import Home from './Home';
import Callback from './Callback';
import Profile from './Profile';
import Login from './Login'; 
import Database from './Database'; 



import Profile2 from './Profile2'

import Messaging from './Messaging';

import Layout from './Layout'; // Import Layout

//Admin
import AdminRequests from './Admin/Requests';
import AdminVolunteerList from './Admin/VolunteerList';
import AdminSupervisorList from './Admin/SupervisorList';

//Supervisor
import SupervisorVolunteerList from './Supervisor/VolunteerList';
import SupervisorRequests from './Supervisor/Requests';

//Volunteer
import AddHours from './Volunteer/AddHours';
import Dashboard from './Volunteer/Dashboard';
import VolunteerRequests from'./Volunteer/Requests';
import VolunteerSupervisorList from './Volunteer/SupervisorList';
import Registration from './Volunteer/Registration';
import LogOfHours from './Volunteer/LogOfHours';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/auth/callback', element: <Callback /> },
  { path: '/profile', element: <Profile /> },
  { path: '/Volunteer/AddHours', element: <AddHours /> }, 
  { path: '/login', element: <Login /> }, 
  { path: '/database', element: <Database /> }, 
  { path: '/Volunteer/Registration', element: <Registration /> }, 
  { path: '/Volunteer/LogOfHours', element: <LogOfHours /> }, 
  { path: '/Supervisor/Requests', element: <SupervisorRequests /> }, 
  { path: '/Volunteer/Requests', element: <VolunteerRequests /> }, 
  { path: '/Profile2', element: <Profile2 /> }, 
  { path: '/Supervisor/VolunteerList', element: <SupervisorVolunteerList /> }, 
  { path: '/Volunteer/SupervisorList', element: <VolunteerSupervisorList /> },
  { path: '/Messaging', element: <Messaging /> },
  { path: '/Volunteer/Dashboard', element: <Dashboard /> },
  { path: '/Layout', element: <Layout /> },
  { path: '/Admin/Requests', element: <AdminRequests /> },
  { path: '/Admin/VolunteerList', element: <AdminVolunteerList /> },
  { path: '/Admin/SupervisorList', element: <AdminSupervisorList /> },
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
