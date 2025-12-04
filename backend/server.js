// server.js - Updated with RAG system
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/database');
const ragService = require('./src/services/ragService');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/chat', require('./src/routes/chatRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      rag: 'ready'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Judicial Chatbot API',
    version: '2.0',
    endpoints: {
      auth: '/api/auth',
      chat: '/api/chat',
      users: '/api/users'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    message: err.message
  });
});

// Initialize services and start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    
    // Initialize RAG system (this takes a minute)
    console.log('🤖 Initializing AI RAG System...');
    await ragService.initialize();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 AI Judicial Chatbot Server Running!');
      console.log('='.repeat(50));
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 URL: http://localhost:${PORT}`);
      console.log(`💾 Database: Connected`);
      console.log(`🤖 RAG System: Ready`);
      console.log(`📚 Knowledge Base: ${ragService.knowledgeBase.length} documents`);
      console.log('='.repeat(50) + '\n');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Shutting down gracefully...');
  process.exit(0);
});