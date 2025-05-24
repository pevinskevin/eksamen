// -- .env Setup --
import dotenv from 'dotenv/config';

// -- Express App Setup --
import express from 'express';
const app = express();
const PORT = process.env.PORT || 8080;

// -- HTTP Server Setup --
import http from 'http';
const server = http.createServer(app);

// -- Websocket Server Setup
import { Server } from 'socket.io';
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
    },
});

// -- Misc. Setup --
import cors from 'cors';
app.use(
    cors({
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

import session from 'express-session';
app.use(
    session({
        secret: `${process.env.SESSION_SECRET}`,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            maxAge: 60000 * 15 /* 15 minutes. */,
        },
    })
);

import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
app.use(helmet());
app.use(express.json());

// -- Index Page Setup --
import { binance, marketDataEmitter } from './binance-ws.js';

// -- Market Update Emitter Setup --
marketDataEmitter.on('marketUpdate', (updatedDataObject) => {
    io.emit('orderBookUpdate', updatedDataObject);
});

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRouter from './routers/authRouter.js';
import accountRouter from './routers/accountRouter.js';
app.use('/api', authRouter, accountRouter);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -- --
io.on('connection', (socket) => {
    console.log('A user successfuly connected via WebSocket:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});

// -- Listener --
server.listen(PORT, () => {
    console.log('Server is running on', PORT);
});
