import React, { useEffect, useState, useContext } from "react";
import { FaBars, FaBell } from "react-icons/fa";
import "./TopNavbar.css";
import MyInvolvementLogo from "./MyInvolvementLogo.jpg";
import { AuthContext } from "./AuthContextProvider";

const TopNavbar = () => {
  const { toggleSidebar } = useContext(AuthContext);
  const [profilePicture, setProfilePicture] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
    setShowDropdown(false); // close notifications if open
  };

  // Fetch Profile Picture
  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_SERVER_URL}/auth/logged_in`,
          {
            credentials: "include",
          }
        );
        const data = await response.json();

        if (data.loggedIn && data.user?.picture) {
          setProfilePicture(data.user.picture);
        } else {
          setProfilePicture("https://via.placeholder.com/40");
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
        setProfilePicture("https://via.placeholder.com/40");
      }
    };

    fetchProfilePicture();
  }, []);

  // Fetch Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userResponse = await fetch(
          `${process.env.REACT_APP_SERVER_URL}/auth/logged_in`,
          {
            credentials: "include",
          }
        );
        const userData = await userResponse.json();

        if (userData.loggedIn && userData.user?.email) {
          const response = await fetch(
            `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/notifications/${userData.user.email}`
          );
          if (!response.ok) throw new Error("Failed to fetch notifications");
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Toggle Dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Mark Notification as Read
  const markAsRead = async (id) => {
    try {
      await fetch(
        `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/notifications/read/${id}`,
        {
          method: "PUT",
        }
      );
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <>
      <nav className="top-navbar">
        <div className="top-navbar-left">
          {/* Hamburger Menu (Unchanged) */}
          <button className="menu-button" onClick={toggleSidebar}>
            <FaBars size={24} />
          </button>
          <img src={MyInvolvementLogo} alt="CPSP Logo" className="top-logo" />
        </div>

        <div className="top-navbar-right">
          {/* Notification Icon */}
          <div className="notification-wrapper">
            <FaBell
              size={20}
              className="notification-icon"
              onClick={toggleDropdown}
            />
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </div>

          <div className="profile-wrapper">
            <img
              src={profilePicture}
              alt="User Profile"
              className="profile-image2"
              onClick={toggleProfileDropdown}
            />

            {showProfileDropdown && (
              <>
                <div
                  className="profile-overlay"
                  onClick={toggleProfileDropdown}
                ></div>
                <div className="profile-dropdown">
                  <div className="profile-info">
                    <div className="profile-icon">
                      <img src={profilePicture} alt="User" />
                    </div>
                    <p className="profile-name">Dubem Eneh</p>
                  </div>
                  <ul className="profile-menu">
                    <li>Paths</li>
                    <li>Event History</li>
                    <li>My Organizations</li>
                    <li>Experiences</li>
                    <li>Service Hours</li>
                    <li>Involvement Record</li>
                    <li>My Submissions</li>
                    <li>My Downloads</li>
                    <li>Send Feedback</li>
                  </ul>
                  <button className="signout-button">SIGN OUT</button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Notification Dropdown */}
      {showDropdown && (
        <>
          <div className="notification-overlay" onClick={toggleDropdown}></div>
          <div className="notification-dropdown">
            <h4>Notifications</h4>
            {loading ? (
              <p>Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p>No new notifications</p>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li key={notification.id} className="notification-item">
                    <p>{notification.message}</p>
                    <small>
                      {new Date(notification.created_at).toLocaleString()}
                    </small>
                    <button onClick={() => markAsRead(notification.id)}>
                      Mark as Read
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default TopNavbar;
