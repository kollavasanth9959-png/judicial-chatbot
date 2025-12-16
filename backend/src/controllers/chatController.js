const Chat = require('../models/Chat');
// FIX 1: Import the entire service object
const ragService = require('../services/ragService');
const { v4: uuidv4 } = require('uuid');

exports.sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    // Validation
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Auto-generate sessionId if not provided
    const activeSessionId = sessionId || uuidv4();

    // Find or create chat session
    let chat = await Chat.findOne({
      user: userId,
      sessionId: activeSessionId,
      isActive: true
    });

    if (!chat) {
      chat = await Chat.create({
        user: userId,
        sessionId: activeSessionId,
        messages: [],
        category: 'general'
      });
    }

    // Add user message to chat history
    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Get conversation context (last 5 messages)
    const context = chat.getContext(5);

    // FIX 2: Call the '.query()' method on the 'ragService' object
    const ragResponse = await ragService.query(message, context);

    // Add assistant response to chat
    chat.messages.push({
      role: 'assistant',
      content: ragResponse.answer,
      sources: ragResponse.sources,
      timestamp: new Date()
    });

    // Auto-set title from first user message
    if (chat.messages.filter(m => m.role === 'user').length === 1) {
      chat.setTitle();
    }

    await chat.save();

    // Increment user's query count
    await req.user.incrementQueryCount();

    // Return response
    res.status(200).json({
      success: true,
      data: {
        sessionId: activeSessionId,
        message: ragResponse.answer,
        sources: ragResponse.sources,
        confidence: ragResponse.confidence,
        chatId: chat._id,
        remainingQueries: req.user.queryLimit === -1
          ? 'unlimited'
          : req.user.queryLimit - req.user.queryCount
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process your message. Please try again.',
      details: error.message
    });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.query;

    let query = { user: userId };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const chats = await Chat.find(query)
      .sort({ updatedAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        chats: chats.map(chat => ({
          sessionId: chat.sessionId,
          title: chat.title,
          category: chat.category,
          messageCount: chat.messages.length,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history',
      details: error.message
    });
  }
};

exports.getChatMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const chat = await Chat.findOne({
      user: userId,
      sessionId: sessionId
    });

    if (!chat) {
      return res.status(4404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        sessionId: chat.sessionId,
        title: chat.title,
        messages: chat.messages,
        category: chat.category
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      details: error.message
    });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const chat = await Chat.findOneAndDelete({
      user: userId,
      sessionId: sessionId
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully'
    });

  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete chat',
      details: error.message
    });
  }
};