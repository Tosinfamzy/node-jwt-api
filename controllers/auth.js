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
      //TODO: Should probably break to a generateRefreshToken function
      const refreshToken = jwt.sign(
        {
          _id: user.id,
          email: user.email,
        },
        process.env.REFRESH_TOKEN_SECRET_KEY,
        {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
      );

      await User.updateOne(
        { email: user.email },
        {
          $push: {
            "security.tokens": {
              refreshToken: refreshToken,
              createdAt: new Date(),
            },
          },
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
            refreshToken: refreshToken,
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

const token = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;
    try {
      const decodeRefreshToken = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET_KEY
      );
      const user = await User.findOne({ email: decodeRefreshToken.email });
      const currentRefreshTokens = user.security.tokens;
      if (
        currentRefreshTokens.some(
          (token) => token.refreshToken === refreshToken
        )
      ) {
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

        res.status().json({
          success: {
            status: 200,
            message: "ACCESS_TOKEN_GENERATED",
            accessToken: accessToken,
          },
        });
      } else {
        res.status(401).json({ status: 401, message: "INVALID_REQUEST_TOKEN" });
      }
    } catch (error) {
      res.status(401).json({ status: 401, message: "INVALID_REQUEST_TOKEN" });
    } // Trycatch in another trycatch...IKR
  } catch (error) {
    res.status(400).json({ status: 400, message: "BAD_REQUEST" });
  }
};

module.exports = { register, token };
