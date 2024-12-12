import React, { useState, useEffect } from 'react';
import './Messaging.css';

const Messaging = () => {
  const [user, setUser] = useState(null); // Logged-in user's data
  const [messages, setMessages] = useState([]); // Messages between users
  const [newMessage, setNewMessage] = useState(''); // New message input
  const [users, setUsers] = useState([]); // List of supervisors/volunteers
  const [receiverEmail, setReceiverEmail] = useState(''); // Selected receiver email
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch logged-in user's data
  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/auth/logged_in`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.loggedIn) {
          setUser(data.user);
        } else {
          console.error('User not logged in');
        }
      } catch (error) {
        console.error('Error fetching logged-in user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoggedInUser();
  }, []);

  // Fetch list of users to message (volunteers for supervisors, supervisors for volunteers)
  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      try {
        const endpoint =
          user.role === 'Supervisor'
            ? `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/supervisor/volunteers/${user.email}`
            : `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/supervisors/by-volunteer/${user.email}`;

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [user]);

  // Fetch messages between the sender and receiver
  useEffect(() => {
    if (!receiverEmail || !user) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/messages/${user.email}/${receiverEmail}`);
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [receiverEmail, user]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_email: user.email, receiver_email: receiverEmail, message: newMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const savedMessage = await response.json();
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: savedMessage.id, sender_email: user.email, receiver_email: receiverEmail, message: newMessage, created_at: new Date().toISOString() },
      ]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="messaging-container">
5      <h2>Messaging</h2>
      {!receiverEmail ? (
        <div className="user-selection">
          <h3>
        Select a {user?.role === 'Volunteer' ? 'Supervisor' : user?.role === 'Supervisor' ? 'Volunteer' : 'User'} to Message
        </h3>

          <ul>
  {console.log('Rendering users:', users)} {/* Debugging log */}
  {users.map((user, index) => (
    <li key={user.email || user.supervisor_email || index}>
      <button
        onClick={() => setReceiverEmail(user.email || user.supervisor_email)}
      >
        {user.first_name || user.supervisor_first_name || 'No Name'}{' '}
        {user.last_name || user.supervisor_last_name || ''} (
        {user.email || user.supervisor_email || 'No Email'})
      </button>
    </li>
  ))}
</ul>
    </div>
      ) : (
        <>
          <div className="messages-list">
            {messages.map((msg) => (
                <div
                key={msg.id}
                className={`message-item ${
                    msg.sender_email === user.email ? 'sent' : 'received'
                }`}
                style={{
                    alignSelf: msg.sender_email === user.email ? 'flex-end' : 'flex-start',
                }}
                >
                <p>{msg.message}</p>
                <small>{new Date(msg.created_at).toLocaleString()}</small>
                </div>
            ))}
          </div>
          <div className="message-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
          <button className="back-button" onClick={() => setReceiverEmail('')}>
            Back to User List
          </button>
        </>
      )}
    </div>
  );
};

export default Messaging;
