// -- .env Setup --
import dotenv from 'dotenv/config';

// -- Express App Setup --
import express from 'express';
const app = express();
const PORT = process.env.PORT || 8080;

// -- OpenAPI Setup --
import swaggerUi from 'swagger-ui-express';
import OpenApiValidator from 'express-openapi-validator';
import addFormats from 'ajv-formats';
import YAML from 'yamljs';
const apiSpec = YAML.load('./openapi.yml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(apiSpec));

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

// IMPORTANT: Cookie parser must come before session middleware
import cookieParser from 'cookie-parser';
app.use(cookieParser());

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

// -- OpenAPI Middlewares Setup (AFTER express.json()) --
app.use(
    OpenApiValidator.middleware({
        apiSpec: apiSpec,
        validateRequests: true,
        validateResponses: false,
        ajvFormats: addFormats, // email, date etc.
        formats: {
            decimal: {
                type: 'string',
                validate: (value) => {
                    // Validate decimal format for financial precision
                    // Matches: "123.45", "0.001", "1000.00", etc.
                    return /^\d+(\.\d+)?$/.test(value) && !isNaN(parseFloat(value));
                },
            },
        },
        // Add security handlers for OpenAPI validation
        validateSecurity: {
            handlers: {
                cookieAuth: (req) => {
                    // OpenAPI validator only checks if the cookie exists
                    // Actual validation happens in isAuthenticated middleware
                    return req.session && req.session.userId ? true : false;
                },
            },
        },
    })
);

// -- Router Setup --

import accountRouter from './features/accounts/accountRouter.js';
app.use('/api/account', accountRouter);

import authRouter from './features/auth/authRouter.js';
app.use('/api', authRouter);

import cryptoRouter from './features/cryptocurrencies/cryptoRouter.js';
app.use('/api', cryptoRouter);

import orderRouter from './features/orders/orderRouter.js';
app.use('/api/order', orderRouter);

// ------------------

// -- socket.io Setup  --
io.on('connection', (socket) => {
    console.log('A user successfuly connected via WebSocket:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});

// -- Market Update Emitter Setup --
import { marketDataEmitter } from './features/trading/orderbook/binance-ws.js';
marketDataEmitter.on('marketUpdate', (updatedDataObject) => {
    io.emit('orderBookUpdate', updatedDataObject);
});

// -- Listener --
server.listen(PORT, () => {
    console.log('Server is running on', PORT);
});
