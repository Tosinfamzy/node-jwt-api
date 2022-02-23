const mongoose = require("mongoose");
const { required } = require("nodemon/lib/config");

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    min: 4,
    max: 25,
  },
  password: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  emailConfirmed: {
    type: Boolean,
    required: true,
    default: true,
  },

  emailToken: {
    type: String,
    required: false,
  },
  security: {
    tokens: [
      {
        refreshToken: String,
        createdAt: Date,
      },
    ],
    passwordReset: {
      token: {
        type: String,
        default: null,
      },
    },
    provisionalPassword: {
      type: String,
      default: null,
    },
    expiry: {
      type: Date,
      default: null,
    },
  },
});

module.exports = mongoose.model('User', userSchema)