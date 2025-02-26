import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import './Messaging.css';

const Messaging = () => {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [receiver, setReceiver] = useState(null);
  const [loading, setLoading] = useState(true);

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

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

  // Fetch list of users excluding the logged-in user
  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/users/${user.email}`);
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();

        // Filter out the logged-in user from the list
        const filteredData = data.filter(u => u.email !== user.email);
        setUsers(filteredData);
        setFilteredUsers(filteredData);
      } catch (error) {
        console.error('Error fetching users:', error.message);
      }
    };

    fetchUsers();
  }, [user]);

  // Filter users based on search term
  useEffect(() => {
    const filtered = users.filter((u) =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Fetch messages between sender and receiver
  useEffect(() => {
    if (!receiver || !user) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_MYSQL_SERVER_URL}/api/messages/${user.email}/${receiver.email}`
        );
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [receiver, user]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !receiver?.email) {
      console.error('Invalid message or user/receiver data');
      return;
    }

    try {
      const messageResponse = await fetch(`${process.env.REACT_APP_MYSQL_SERVER_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_email: user.email,
          receiver_email: receiver.email,
          message: newMessage,
        }),
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to send message');
      }

      const savedMessage = await messageResponse.json();
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: savedMessage.id,
          sender_email: user.email,
          receiver_email: receiver.email,
          message: newMessage,
          created_at: new Date().toISOString(),
        },
      ]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="messaging-container">
      <div className="contacts-sidebar">
        <h2>Contacts</h2>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="search-icon" />
        </div>

        <ul className="user-list">
          {filteredUsers.map((u) => (
            <li
              key={u.email}
              className="user-list-item"
              onClick={() => setReceiver(u)}
            >
              <div className="profile-avatar">{getInitials(u.first_name, u.last_name)}</div>
              <div className="user-info">
                <span className="user-name">
                  {u.first_name} {u.last_name} ({u.organization_name} {u.role})
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="messaging-panel">
        {receiver ? (
          <>
            <div className="conversation-header">
              <h2>Conversation with {receiver.first_name} {receiver.last_name}</h2>
              <button className="back-button" onClick={() => setReceiver(null)}>Back</button>
            </div>

            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-item-container ${msg.sender_email === user.email ? 'sent' : 'received'}`}
                >
                  {msg.sender_email !== user.email && (
                    <div className="profile-avatar">
                      {getInitials(receiver.first_name, receiver.last_name)}
                    </div>
                  )}
                  <div className={`message-item ${msg.sender_email === user.email ? 'sent' : 'received'}`}>
                    <p>{msg.message}</p>
                    <small>{new Date(msg.created_at).toLocaleString()}</small>
                  </div>
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
          </>
        ) : (
          <div className="empty-message-panel">
            <p>Select a contact to start a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
