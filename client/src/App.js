import './App.css';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import AuthContextProvider from './AuthContextProvider';
import Home from './Home';
import Callback from './Callback';
import Profile from './Profile';
import AddHours from './AddHours';
import Login from './Login'; 
import Database from './Database'; 
import Registration from './Registration';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/auth/callback', element: <Callback /> },
  { path: '/profile', element: <Profile /> },
  { path: '/add-hours', element: <AddHours /> }, 
  { path: '/login', element: <Login /> }, 
  { path: '/database', element: <Database /> }, 
  { path: '/Registration', element: <Registration /> }, 
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
