const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Serve static files from 'public' directory
let connectedSockets = [];

app.use(express.static('public')); // Serve static files from 'public' directory

io.on('connection', (socket) => {


    console.log('A user connected:', socket.id);

    // Add the connected socket to the list
    connectedSockets.push(socket.id);

    // Emit the list of all connected socket IDs to the newly connected client
    socket.emit('connected-sockets', { sockets: connectedSockets });

    // Optionally, broadcast to all other clients the updated list of connected sockets
    io.emit('connected-sockets-update', { sockets: connectedSockets });


    // Handle call request
    socket.on('call-request', (data) => {
        console.log('Call request from:', socket.id, 'to:', data.to);
        io.to(data.to).emit('call-request', { from: socket.id, offer: data.offer });
    });

    // Handle answer
    socket.on('answer', (data) => {
        console.log('Answer from:', socket.id, 'to:', data.to);
        io.to(data.to).emit('answer', { from: socket.id, answer: data.answer });
    });

    // Handle ICE candidate
    socket.on('ice-candidate', (data) => {
        console.log('ICE candidate from:', socket.id, 'to:', data.to);
        io.to(data.to).emit('ice-candidate', { candidate: data.candidate });
    });

    // Handle call declined
    socket.on('call-declined', (data) => {
        console.log('Call declined from:', socket.id, 'to:', data.to);
        io.to(data.to).emit('call-declined', { from: socket.id });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start the server
// Listen on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
