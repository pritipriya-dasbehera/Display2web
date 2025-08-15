/*
 * Main driver file for the server (refactored for modern Express/Socket.io)
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import { router } from './api/routes';
import { PORT, HOST } from './config';
import logger from './log/config';

// Initialize Express App
const app = express();

// Set EJS as view engine and serve static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*', // Adjust as needed for production
		methods: ['GET', 'POST'],
	},
});

// Enable CORS
app.use(cors());

// Enable JSON body parsing
app.use(express.json());

// Socket.io connection handler
io.on('connection', (socket) => {
	socket.on('join', ({ roomId, user }) => {
		console.log(`User ${user} joining room ${roomId}`);
		socket.join(roomId);
		// Notify others in the room that a new user connected
		socket.to(roomId).emit('user-connected', user);
		console.log(`Emitted 'user-connected' for user ${user} in room ${roomId}`);

		socket.on('disconnect', () => {
			console.log(`User ${user} disconnected from room ${roomId}`);
			socket.to(roomId).emit('user-disconnected', user);
		});
	});
});

// Use API routers
app.use(router);

// Start server
server.listen(PORT, HOST, () => {
	logger.info(`🚀 Server running on http://${HOST}:${PORT} 🚀`);
});
