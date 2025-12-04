const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  format: {
    type: String,
    enum: ['text', 'table', 'json'],
    default: 'text'
  },
  tableData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  sources: [{
    title: String,
    content: String,
    relevance: Number
  }],
  timestamp: {
    type: Date,
    default: Date.now
  },
  isVoiceQuery: {
    type: Boolean,
    default: false
  }
});

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: [messageSchema],
  category: {
    type: String,
    enum: ['general', 'njdg', 'e-filing', 'court-info', 'legal-aid', 'other'],
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

chatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

chatSchema.methods.setTitle = function() {
  const firstUserMessage = this.messages.find(msg => msg.role === 'user');
  if (firstUserMessage) {
    this.title = firstUserMessage.content.substring(0, 50) + '...';
  }
};

chatSchema.methods.getContext = function(limit = 5) {
  return this.messages
    .slice(-limit)
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }));
};

module.exports = mongoose.model('Chat', chatSchema);