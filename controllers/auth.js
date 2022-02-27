const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const validation = require("../helpers/validation");
const { options } = require("joi");

const login = async (req, res) => {
  try {
    const { error } = validation.loginSchema.validate(req.body, {
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
      const user = User.findOne({ email: req.body.email });
      if (user) {
        const validatePassword = await bcrypt.compare(
          req.body.password,
          user.password
        );
        if (validatePassword) {
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
          if (await addRefreshToken(user,refreshToken)) {
            res.status(200).json({status: 200, message: 'LOGIN_SUCCESS', accessToken: accessToken, refreshToken: refreshToken})
          } else {
            res.status(500).json({status: 500, message: 'SERVER_ERROR'})
          }
        }
      }
    }
  } catch (error) {
    res.status(400).json({ status: 400, message: "BAD_REQUEST" });
  }
};

const register = async () => {
  try {
    const { error } = validation.registerSchema.validate(req.body, {
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
      await sendEmailConfirmation({
        email: user.email,
        emailToken: user.emailToken,
      });
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

const confirmEmailToken = (req, res) => {
  try {
    const emailToken = req.body.emailToken;
    if (email !== null) {
      const accessToken = req.header("Authorization").split(" ")[1];
      const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
      const user = await User.findOne({ email: decodedToken.email });
      if (!user.emailConfirmed && emailToken === user.emailToken) {
        await User.updateOne(
          { email: decodedToken.email },
          { $set: { emailConfirmed: null, emailToken: null } }
        );
        res
          .status(400)
          .json({ success: { status: 200, message: "EMAIL_CONFIRM" } });
      } else {
        res.status(400).json({ status: 400, message: "BAD_REQUEST" });
      }
    }
  } catch (error) {
    res.status(400).json({ status: 400, message: "BAD_REQUEST" });
  }
};

const sendEmailConfirmation = async (user) => {
  const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  const info = await transport.sendMail({
    from: "test@test.com",
    to: user.email,
    subject: "Confirm your email",
    text: `Confirm your email at http://localhost${process.env.PORT}/confirm-email/${user.emailToken}`,
  });
};

const addRefreshToken = async (user, refreshToken) => {
  try {
    const existingRefreshTokens = user.security.tokens;
    if (existingRefreshTokens.length < 5) {
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
    } else {
      await User.updateOne(
        { email: user.email },
        {
          $pull: {
            "security.tokens": {
              _id: existingRefreshTokens[0]._id,
            },
          },
        }
      ); // pop one off the array and insert the new token
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
    }
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = { register, token, confirmEmailToken, login };
