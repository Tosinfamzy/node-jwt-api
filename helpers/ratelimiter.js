const rateLimit = require("express-rate-limit");

const rateLimiter = (limit, timeFrameInMinutes) => {
  return rateLimit({
    max: limit,
    windowMs: timeFrameInMinutes * 60 * 100,
    message: {
      error: {
        status: 429,
        message: "TOO_MANY_REQUESTS",
        expiry: timeFrameInMinutes,
      },
    },
  });
};

module.exports = rateLimit;
