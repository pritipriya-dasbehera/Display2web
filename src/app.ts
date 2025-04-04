/* eslint-disable prefer-template */
/*
 * @Author: Ishaan Ohri
 * @Date: 2021-02-03 14:14:17
 * @Last Modified by: Ishaan Ohri
 * @Last Modified time: 2021-02-07 17:21:55
 * @Description: Main driver file for the server
 */

import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { router } from './api/routes';
import { PORT, HOST } from './config';
import logger from './log/config';

// Initializing Express App
const app: Application = express();

// EJS and static files
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));

// Creating Socket.io and HTTP Server
const server = createServer(app);
const io = new Server(server);

// CORS
app.use(cors());

// Body parser
app.use(express.json());

// Establishing io connections
io.on('connection', (socket: Socket) => {
	socket.on('join', ({ roomId, user }: { roomId: string; user: string }) => {
		// Using console.log for server-side info as logger might not be configured correctly everywhere
		console.log(`User ${user} joining room ${roomId}`);
		socket.join(roomId);
		// Notify others in the room that a new user connected
		socket.to(roomId).broadcast.emit('user-connected', user);
		console.log(`Emitted 'user-connected' for user ${user} in room ${roomId}`);

		socket.on('disconnect', () => {
			console.log(`User ${user} disconnected from room ${roomId}`);
			socket.to(roomId).broadcast.emit('user-disconnected', user);
		});
	});
	// Removed getSharerId handler
});

// Import routers
app.use(router);

// Start Express App
server.listen(PORT, HOST, () => {
	logger.info(`🚀 Server running on http://${HOST}:${PORT} 🚀`);
});
