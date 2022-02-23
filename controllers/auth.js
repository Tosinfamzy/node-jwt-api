const User = require("../models/User");

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

module.exports = {test}
