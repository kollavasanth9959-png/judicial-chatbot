const express = require('express');
const router = express.Router();
const { protect, checkQueryLimit } = require('../middleware/authMiddleware');
const { 
  sendMessage, 
  getChatHistory, 
  getChatMessages, 
  deleteChat 
} = require('../controllers/chatController');

// Send a message in a chat session
router.post('/query', protect, checkQueryLimit, sendMessage);

// Get all chat sessions for a user
router.get('/history', protect, getChatHistory);

// Get messages for a specific session
router.get('/session/:sessionId', protect, getChatMessages);

// Delete a chat session
router.delete('/session/:sessionId', protect, deleteChat);

module.exports = router;