const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.header("Authorization").split(" ")[1];

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET_KEY);
      next();
    } catch (error) {
      res.status(401).json({ status: 401, message: "INVALID_TOKEN" });
    }
  } else {
    res.status(400).json({ status: 400, message: "ACCESS_DENIED" });
  }
};

module.exports = auth;
