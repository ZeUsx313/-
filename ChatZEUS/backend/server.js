/**
 * ChatZEUS Backend Server
 * خادم ChatZEUS الخلفي
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import routes
const agentsRoutes = require('./routes/agents');
const apiKeysRoutes = require('./routes/apiKeys');
const conversationsRoutes = require('./routes/conversations');
const projectsRoutes = require('./routes/projects');
const filesRoutes = require('./routes/files');
const tasksRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');
const orchestratorRoutes = require('./routes/orchestrator');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const auth = require('./middleware/auth');

// Import services
const DatabaseService = require('./services/databaseService');
const LoggerService = require('./services/loggerService');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Initialize services
const logger = new LoggerService();
const dbService = new DatabaseService();

// Environment variables
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatzeus';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"]
        }
    }
}));

app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Static files (for production)
if (NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend')));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        version: require('./package.json').version
    });
});

// API Routes
app.use('/api/agents', auth, agentsRoutes);
app.use('/api/api-keys', auth, apiKeysRoutes);
app.use('/api/conversations', auth, conversationsRoutes);
app.use('/api/projects', auth, projectsRoutes);
app.use('/api/files', auth, filesRoutes);
app.use('/api/tasks', auth, tasksRoutes);
app.use('/api/ai', auth, aiRoutes);
app.use('/api/orchestrator', auth, orchestratorRoutes);

// Stats endpoint
app.get('/api/stats', auth, async (req, res) => {
    try {
        const stats = await dbService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get statistics'
        });
    }
});

// Clear all data endpoint (for testing)
if (NODE_ENV === 'development') {
    app.post('/api/clear-all', auth, async (req, res) => {
        try {
            await dbService.clearAllData();
            res.json({
                success: true,
                message: 'All data cleared successfully'
            });
        } catch (error) {
            logger.error('Error clearing data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to clear data'
            });
        }
    });
}

// Serve frontend for production
if (NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });
}

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join room for specific conversation
    socket.on('join-conversation', (conversationId) => {
        socket.join(`conversation-${conversationId}`);
        logger.info(`Client ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave-conversation', (conversationId) => {
        socket.leave(`conversation-${conversationId}`);
        logger.info(`Client ${socket.id} left conversation ${conversationId}`);
    });

    // Handle agent messages
    socket.on('agent-message', (data) => {
        const { conversationId, message } = data;
        io.to(`conversation-${conversationId}`).emit('new-message', message);
        logger.info(`Agent message sent to conversation ${conversationId}`);
    });

    // Handle task updates
    socket.on('task-update', (data) => {
        const { conversationId, update } = data;
        io.to(`conversation-${conversationId}`).emit('task-updated', update);
        logger.info(`Task update sent to conversation ${conversationId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

// Start server
async function startServer() {
    try {
        // Connect to MongoDB
        await dbService.connect(MONGODB_URI);
        logger.info('Connected to MongoDB successfully');

        // Start HTTP server
        server.listen(PORT, () => {
            logger.info(`ChatZEUS server running on port ${PORT}`);
            logger.info(`Environment: ${NODE_ENV}`);
            logger.info(`Health check: http://localhost:${PORT}/health`);
            
            if (NODE_ENV === 'development') {
                logger.info(`API documentation: http://localhost:${PORT}/api-docs`);
            }
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the server
startServer();

module.exports = { app, server, io };