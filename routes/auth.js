const express = require("express");

const authController = require("../controllers/auth");

const rateLimiter = require("../helpers/ratelimiter");
const verifyToken = require("../helpers/verifytoken");
const router = express.Router();

router.get("/", [rateLimiter(1, 10), verifyToken], authController.test);

router.post("/register", authController.register);
router.post("/token", authController.token);

module.exports = router;
