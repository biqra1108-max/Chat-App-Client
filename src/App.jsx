import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const SOCKET_SERVER_URL = "https://chat-app-server-xi-sand.vercel.app/"; 
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
  const fileInputRef = useRef(null);

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
    if (!username.trim() || !room.trim()) {
      alert("Please enter both your name and Room ID!");
      return;
    }
    
    if (currentRoom) {
      socket.emit("leave", currentRoom);
    }

    socket.emit("join", room.trim());
    setCurrentRoom(room.trim());
    setJoined(true);
    setMessages((prev) => [...prev, { user: "System", text: `You joined "${room.trim()}"`, system: true }]);
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

  // Text message send karne ka function
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const messageData = {
      room: currentRoom,
      user: username.trim(),
      text: messageInput,
      type: "text",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socket.emit("send", messageData);
    setMessageInput("");
  };

  // Image ya Video file handle aur convert karne ka function
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const fileType = file.type.startsWith("video") ? "video" : "image";
      const messageData = {
        room: currentRoom,
        user: username.trim(),
        text: reader.result, // Base64 string
        type: fileType,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      socket.emit("send", messageData);
    };
    reader.readAsDataURL(file);
  };

  // Emoji add karne ka shortcut function
  const addEmoji = (emoji) => {
    setMessageInput((prev) => prev + emoji);
  };

  return (
    <div className="wa-app-container">
      {/* Sidebar */}
      <div className="wa-sidebar">
        <div className="wa-sidebar-header">
          <div className="wa-brand">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="#25d366">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span className="wa-brand-title">WhatsApp</span>
          </div>
          <div className="wa-status-box">
            <span className={`wa-dot ${isConnected ? "online" : "offline"}`}></span>
            <span className="wa-status-label">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>

        <div className="wa-form-container">
          <form onSubmit={handleJoin} className="wa-form">
            <div className="wa-field">
              <label>Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="wa-text-input"
                required
              />
            </div>

            <div className="wa-field">
              <label>Room ID</label>
              <input
                type="text"
                placeholder="Enter Room ID"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="wa-text-input"
                required
              />
            </div>

            <button type="submit" className="wa-submit-btn">
              Join Chat
            </button>
          </form>

          {joined && (
            <div className="wa-current-room">
              <p className="wa-small-heading">Active Room</p>
              <div className="wa-room-badge">
                <span className="wa-room-initial">{currentRoom.charAt(0).toUpperCase()}</span>
                <span>{currentRoom}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="wa-chat-pane">
        {joined ? (
          <>
            <div className="wa-chat-header">
              <div className="wa-chat-info">
                <h3>{currentRoom}</h3>
                <p>Joined as <span className="wa-user-highlight">{username}</span></p>
              </div>
              <button onClick={handleLeave} className="wa-leave-btn">
                Leave Room
              </button>
            </div>

            <div className="wa-messages-area">
              {messages.map((msg, index) => {
                if (msg.system) {
                  return (
                    <div key={index} className="wa-system-row">
                      <span className="wa-system-pill">{msg.text}</span>
                    </div>
                  );
                }

                const isMe = msg.user === username;

                return (
                  <div key={index} className={`wa-msg-row ${isMe ? "sent" : "received"}`}>
                    <div className={`wa-bubble ${isMe ? "sent" : "received"}`}>
                      {!isMe && <div className="wa-sender-name">{msg.user}</div>}
                      
                      {/* Message Type Handling (Text, Image, Video) */}
                      {msg.type === "image" ? (
                        <img src={msg.text} alt="shared media" className="wa-media-content" />
                      ) : msg.type === "video" ? (
                        <video controls src={msg.text} className="wa-media-content" />
                      ) : (
                        <p className="wa-msg-body">{msg.text}</p>
                      )}

                      <span className="wa-timestamp">{msg.time}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Bar with Emojis & File Upload */}
            <div className="wa-input-footer">
              <div className="emoji-quick-bar">
                <span onClick={() => addEmoji("😊")}>😊</span>
                <span onClick={() => addEmoji("😂")}>😂</span>
                <span onClick={() => addEmoji("❤️")}>❤️</span>
                <span onClick={() => addEmoji("👍")}>👍</span>
                <span onClick={() => addEmoji("🎉")}>🎉</span>
              </div>

              <form onSubmit={handleSendMessage} className="wa-send-form">
                {/* Hidden File Input for Images/Videos */}
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  ref={fileInputRef} 
                  style={{ display: "none" }} 
                  onChange={handleFileUpload}
                />
                
                {/* Attachment Button */}
                <button 
                  type="button" 
                  className="wa-attach-btn" 
                  onClick={() => fileInputRef.current.click()}
                  title="Send Image or Video"
                >
                  📎
                </button>

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="wa-msg-input"
                />

                <button type="submit" className="wa-send-icon-btn">
                  ➤
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="wa-welcome-screen">
            <div className="wa-welcome-box">
              <h2>WhatsApp Web Realtime</h2>
              <p>Enter your name and Room ID on the left panel to start chatting.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}