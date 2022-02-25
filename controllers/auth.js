const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const validation = require("../helpers/validation");
const { options } = require("joi");

const register = async () => {
  try {
    const error = validation.registerSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      res.status(400).json({
        status: 400,
        message: "INPUT_ERRORS",
        errors: error.details,
        original: error._original,
      });
    } else {
      //TODO: Should probably break the hashing of password to another function
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      const user = new User({
        email: req.body.email,
        password: hashedPassword,
        emailConfirmed: false,
        emailToken: uuidv4(),
        security: {
          tokens: [],
          passwordReset: {
            token: null,
            provisionalPassword: null,
            expiry: null,
          },
        },
      });
      await user.save();
      //TODO: Should probably break to a generateToken function
      const accessToken = jwt.sign(
        {
          _id: user.id,
          email: user.email,
        },
        process.env.JWT_SECRET_KEY,
        {
          expiresIn: process.env.ACCES_TOKEN_EXPIRY,
        }
      );

      res
        .status(200)
        .header()
        .json({
          success: {
            status: 200,
            message: "REGISTTRATION_SUCCESSFUL",
            accessToken: accessToken,
            user: {
              id: user.id,
              email: user.email,
            },
          },
        });
    }
  } catch (error) {
    let errorMessage;
    if (err.keyPattern.email === 1) {
      errorMessage = "EMAIL_ALREADY_EXISTS";
    } else {
      errorMessage = err;
    }
    res.status(400).json({ status: 400, message: errorMessage });
  }
};

module.exports = { register };
