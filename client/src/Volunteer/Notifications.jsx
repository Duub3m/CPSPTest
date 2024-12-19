import React, { useState, useEffect } from 'react';
import '../Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  // Fetch logged-in user and notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetch logged-in user details
        const userResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const userData = await userResponse.json();

        if (!userData.loggedIn) {
          console.error('User not logged in');
          setError('You need to be logged in to view notifications.');
          setLoading(false);
          return;
        }

        const email = userData.user.email;
        setRecipientEmail(email);

        // Fetch unread notifications for the user
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
        setError('Failed to load notifications.');
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

      // Remove the notification from the list
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="notifications-container">
      <h3>Notifications</h3>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : notifications.length === 0 ? (
        <p>No new notifications</p>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`notification-item ${notification.notification_type}`}
              style={{
                borderLeft: `5px solid ${
                  notification.notification_type === 'Request'
                    ? 'blue'
                    : notification.notification_type === 'Approval'
                    ? 'green'
                    : notification.notification_type === 'Rejection'
                    ? 'red'
                    : 'gray'
                }`,
              }}
            >
              <p>{notification.message}</p>
              <small>{new Date(notification.created_at).toLocaleString()}</small>
              <button onClick={() => markAsRead(notification.id)}>Mark as Read</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
