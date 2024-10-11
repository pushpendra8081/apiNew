const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

// Initialize Express app
const app = express();

// Enable CORS for all origins (Adjust in production)
app.use(cors());

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

  // Add user to connectedUsers
  connectedUsers[socket.id] = socket;

  // Broadcast when a user connects
  socket.broadcast.emit('message', `User ${socket.id} has joined the chat`);

  // Listen for chat messages
  socket.on('chat_message', (data) => {
    console.log(`Message from ${socket.id}: ${data}`);
    // Broadcast the message to all clients
    io.emit('chat_message', { sender: socket.id, message: data });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    delete connectedUsers[socket.id];
    // Broadcast when a user disconnects
    socket.broadcast.emit('message', `User ${socket.id} has left the chat`);
  });
});

// Define a simple route
app.get('/', (req, res) => {
  res.send('Socket.IO Chat Server is running');
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  const host = '192.168.1.7';  // Your local IP address
  console.log(`Server is running on http://${host}:${PORT}`);
});
