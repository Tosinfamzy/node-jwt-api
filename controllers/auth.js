const User = require("../models/User");
const jwt = require("jsonwebtoken");

const token = async (req, res) => {
  const accessToken = jwt.sign(
    {
      email: "test@test.com",
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.ACCES_TOKEN_EXPIRY }
  );
  res.send(accessToken)
};
const test = async (req, res) => {
  try {
    const newUser = new User({
      email: "test@test.com",
      password: "test",
      emailConfirmed: false,
      emailToken: "test",
      security: {
        tokens: null,
        passwordReset: null,
      },
    });
    await newUser.save();
    res.send(newUser);
  } catch (error) {
    res.send(error);
  }
};

module.exports = { test };
