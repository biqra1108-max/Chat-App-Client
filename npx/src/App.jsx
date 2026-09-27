import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const SOCKET_SERVER_URL = "http://localhost:5050"; 
const socket = io(SOCKET_SERVER_URL);

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [joined, setJoined] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    
    socket.on("message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("message");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!username.trim() || !room.trim()) return;
    
    if (currentRoom) {
      socket.emit("leave", currentRoom);
    }

    setCurrentRoom(room);
    setJoined(true);
    setMessages((prev) => [...prev, { user: "System", text: `You joined "${room}"`, system: true }]);
  };

  const handleLeave = () => {
    if (currentRoom) {
      socket.emit("leave", currentRoom);
    }
    setJoined(false);
    setCurrentRoom("");
    setRoom("");
    setMessages([]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const messageData = {
      room: currentRoom,
      user: username,
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socket.emit("send", messageData);
    setMessages((prev) => [...prev, messageData]);
    setMessageInput("");
  };

  return (
    <div className="app-container">
      
      {/* LEFT SIDEBAR (Jaise pehli image mein tha) */}
      <div className="sidebar">
        {/* Header with WhatsApp Logo & Realtime Chat */}
        <div className="sidebar-header">
          <div className="whatsapp-brand">
            {/* Original WhatsApp SVG Logo */}
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="whatsapp-logo">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <span>Realtime Chat</span>
          </div>
          <div className="status-container">
            <span className={`status-dot ${isConnected ? "online" : "offline"}`}></span>
            <span className="status-text">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="sidebar-form-area">
          <form onSubmit={handleJoin}>
            <div className="input-group">
              <label>Your name</label>
              <input
                type="text"
                placeholder=""
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-input"
                required
              />
            </div>

            <div className="input-group">
              <label>Room ID</label>
              <input
                type="text"
                placeholder=""
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="text-input"
                required
              />
            </div>

            <button type="submit" className="join-btn">
              Join
            </button>
          </form>

          <div className="current-room-section">
            <p className="section-label">Current room</p>
            {joined && (
              <div className="room-badge-item">
                <div className="room-avatar-mini">{currentRoom.charAt(0).toUpperCase()}</div>
                <span>{currentRoom}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT CHAT WINDOW */}
      <div className="chat-window">
        {joined ? (
          <>
            {/* Top Chat Header */}
            <div className="chat-top-header">
              <div className="chat-room-title-area">
                <h3>{currentRoom}</h3>
                <p>Joined as <span className="joined-username">{username}</span></p>
              </div>
              <button onClick={handleLeave} className="leave-btn">
                Leave
              </button>
            </div>

            {/* Messages Box */}
            <div className="messages-box">
              {messages.map((msg, index) => {
                if (msg.system) {
                  return (
                    <div key={index} className="system-msg-container">
                      <span className="system-msg-text">{msg.text}</span>
                    </div>
                  );
                }

                const isMe = msg.user === username;

                return (
                  <div key={index} className={`msg-row ${isMe ? "sent" : "received"}`}>
                    <div className={`msg-bubble ${isMe ? "sent" : "received"}`}>
                      {!isMe && <div className="msg-sender">{msg.user}</div>}
                      <p className="msg-text">{msg.text}</p>
                      <span className="msg-time">{msg.time || "10:57 AM"}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area */}
            <div className="chat-bottom-bar">
              <form onSubmit={handleSendMessage} className="msg-form">
                <input
                  type="text"
                  placeholder="Type a message"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="msg-input"
                />
                <button type="submit" className="send-icon-btn">
                  {/* Send Paperplane Icon */}
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                  </svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="welcome-placeholder">
            <div className="welcome-placeholder-content">
              <h3>WhatsApp Web Realtime Chat</h3>
              <p>Enter your name and Room ID on the left panel to join a group chat.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}