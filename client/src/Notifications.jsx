import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  // Fetch logged-in user and notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const userData = await userResponse.json();

        if (!userData.loggedIn) {
          setError('You need to be logged in to view notifications.');
          setLoading(false);
          return;
        }

        const email = userData.user.email;
        setReceiverEmail(email);

        const notificationsResponse = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/notifications/${email}`
        );

        if (!notificationsResponse.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await notificationsResponse.json();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/notifications/read/${id}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleViewMessage = async (id, senderEmail) => {
    try {
      await markAsRead(id);
      navigate(`/Messaging`, { state: { senderEmail } });
    } catch (error) {
      console.error('Error handling view message:', error);
    }
  };

  return (
    <div className="notifications-wrapper">
      <div className="notification-icon" onClick={() => setShowDropdown(!showDropdown)}>
        <FaBell size={24} />
        {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
      </div>

      {showDropdown && (
        <div className="notification-dropdown">
          <h3>Notifications</h3>
          {loading ? (
            <p>Loading notifications...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : notifications.length === 0 ? (
            <p>No new notifications</p>
          ) : (
            <ul className="notifications-list">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`notification-item ${notification.notification_type}`}
                  style={{
                    borderLeft: `5px solid ${
                      notification.notification_type === 'Message'
                        ? 'blue'
                        : notification.notification_type === 'Approval'
                        ? 'green'
                        : notification.notification_type === 'Rejection'
                        ? 'red'
                        : 'gray'
                    }`,
                  }}
                >
                  <div className="notification-content">
                    <p><strong>Message:</strong> {notification.message}</p>
                    <p><strong>Sender:</strong> {notification.sender_email}</p>
                    <small>{new Date(notification.created_at).toLocaleString()}</small>
                  </div>
                  {notification.notification_type === 'Message' ? (
                    <button
                      className="view-message-btn"
                      onClick={() => handleViewMessage(notification.id, notification.sender_email)}
                    >
                      View Message
                    </button>
                  ) : (
                    <button
                      className="mark-as-read-btn"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark as Read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
