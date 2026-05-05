const mongoose = require('mongoose');

const ROLES = ['Student', 'Faculty', 'Admin'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'Student',
    },
    bio: {
      type: String,
      default: '',
    }
  },
  {
    timestamps: true,
  }
);

module.exports = {
  User: mongoose.model('User', userSchema),
  ROLES,
};

