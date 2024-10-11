// chat_backend/server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// Initialize Express app
const app = express();

// Enable CORS for all origins (Adjust in production)
app.use(cors());

// Serve static files from the 'assets' directory
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Define PORT before using it
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO server
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins (Adjust in production)
    methods: ["GET", "POST"]
  }
});

// Store connected users
let connectedUsers = {};

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Listen for 'set_user' event to receive user details from client
  socket.on('set_user', (data) => {
    // Basic validation
    if (!data.name) {
      socket.emit('error', 'Name is required');
      return;
    }

    connectedUsers[socket.id] = {
      hostId: socket.id,
      name: data.name,
      role: data.role || 'User',
      status: data.status || 'Available',
      imagePath: data.imagePath
        ? data.imagePath.startsWith('http')
          ? data.imagePath
          : `http://192.168.1.7:${PORT}/assets/${data.imagePath}`
        : `http://192.168.1.7:${PORT}/assets/default.jpg`, // Default image
      age: data.age || 25,
      topics: data.topics || 'General',
      languages: data.languages || 'English',
      isOnline: true,
    };

    // Join a room with the socket.id to facilitate private messaging
    socket.join(socket.id);

    // Emit the updated user list to all clients
    io.emit('users', Object.values(connectedUsers));

    // Broadcast system message
    socket.broadcast.emit('message', `User ${connectedUsers[socket.id].name} has joined the chat`);
  });

  // Listen for chat messages
  socket.on('chat_message', (data) => {
    // Basic validation
    if (!data.hostId || !data.message) {
      socket.emit('error', 'hostId and message are required');
      return;
    }

    const receiver = connectedUsers[data.hostId];
    if (!receiver) {
      socket.emit('error', `User with ID ${data.hostId} is not connected.`);
      return;
    }

    console.log(`Message from ${socket.id} to ${data.hostId}: ${data.message}`);

    // Send the message to the specific hostId room
    io.to(data.hostId).emit('chat_message', {
      sender: connectedUsers[socket.id].name,
      message: data.message,
    });

    // Optionally, send acknowledgment to sender
    socket.emit('message_sent', {
      to: connectedUsers[data.hostId].name,
      message: data.message,
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    if (connectedUsers[socket.id]) {
      const userName = connectedUsers[socket.id].name;
      delete connectedUsers[socket.id];

      // Emit the updated user list to all clients
      io.emit('users', Object.values(connectedUsers));

      // Broadcast system message
      socket.broadcast.emit('message', `User ${userName} has left the chat`);
    }
  });
});

// Define a simple route
app.get('/', (req, res) => {
  res.send('Socket.IO Chat Server is running');
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running at http://192.168.1.7:${PORT}`);
});
