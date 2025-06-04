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
import { Server, Socket } from 'socket.io';
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
        validateResponses: true,
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

app.use((err, req, res, next) => {
    // Convert OpenAPI validator errors to JSON
    if (err.status) {
        return res.status(err.status).json({
            error: err.name || 'ValidationError',
            message: err.message,
        });
    }
    next(err);
});

// -- Router Setup --

import accountRouter from './features/accounts/accountRouter.js';
app.use('/api/account', accountRouter);

import authRouter from './features/auth/authRouter.js';
app.use('/api', authRouter);

import cryptoRouter from './features/cryptocurrencies/cryptoRouter.js';
app.use('/api', cryptoRouter);

import orderRouter from './features/orders/orderRouter.js';
app.use('/api/order', orderRouter);

// Selective error handler - only for OpenAPI structural validation errors
app.use((err, req, res, next) => {
    // Only handle OpenAPI structural validation errors (missing fields, wrong types, etc.)
    // Let business logic validation errors reach the controllers
    if (err.status === 400 && err.errors && err.message.includes('must have required property')) {
        const errorMessage = err.errors.map((error) => error.message).join(', ');
        return res.status(400).json({
            error: 'ValidationError',
            message: errorMessage,
        });
    }

    // Pass all other errors to the next handler (including your controller validation)
    next(err);
});

// -- Market Update Emitter Setup --
import { marketDataEmitter } from './features/trading/orderbook/binance-ws.js';
marketDataEmitter.on('marketUpdate', (updatedDataObject) => {
    io.emit('orderBookUpdate', updatedDataObject);
});

// -- Market Order Engine Setup (to register its event listeners) --
import './features/trading/orderbook/market-order-engine.js';
import { initializeTradeNotifier } from './shared/notifications/tradeNotifier.js';

// ------------------

// -- socket.io Setup  --
io.on('connection', (socket) => {
    console.log('A user successfuly connected via WebSocket:', socket.id);

    initializeTradeNotifier(io);

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });

    socket.on('joinRoom', (roomName) => {
        socket.join(roomName);
        socket.emit('joined', `You've joined room ${roomName}`);
    });
});

// -- Listener --
server.listen(PORT, () => {
    console.log('Server is running on', PORT);
});

// -- Graceful Shutdown --
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    // Close HTTP server
    server.close((err) => {
        if (err) {
            console.error('Error during server shutdown:', err);
            process.exit(1);
        }

        console.log('HTTP server closed');

        // Close Socket.IO server
        io.close(() => {
            console.log('Socket.IO server closed');
            console.log('Graceful shutdown complete');
            process.exit(0);
        });
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Handle different termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});
