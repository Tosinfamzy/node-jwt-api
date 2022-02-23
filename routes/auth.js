const express = require("express");
const authController = require("../controllers/auth");
const rateLimiter = require("../helpers/ratelimiter");
const router = express.Router();

router.get("/", rateLimiter(1, 10), authController.test);

module.exports = router;
