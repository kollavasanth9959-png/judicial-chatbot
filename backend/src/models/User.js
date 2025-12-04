const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['standard', 'premium', 'student', 'legal_professional', 'judicial_officer', 'paralegal'],
    default: 'standard'
  },
  organization: {
    type: String,
    default: null
  },
  queryCount: {
    type: Number,
    default: 0
  },
  queryLimit: {
    type: Number,
    default: function() {
      const limits = {
        standard: 50,
        premium: -1,
        student: 100,
        legal_professional: 500,
        judicial_officer: -1,
        paralegal: 300
      };
      return limits[this.role] || 50;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.canMakeQuery = function() {
  if (this.queryLimit === -1) return true;
  return this.queryCount < this.queryLimit;
};

userSchema.methods.incrementQueryCount = async function() {
  this.queryCount += 1;
  await this.save();
};

userSchema.methods.resetQueryCount = async function() {
  this.queryCount = 0;
  await this.save();
};

module.exports = mongoose.model('User', userSchema);