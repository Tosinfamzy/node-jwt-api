const express = require("express");

const authController = require("../controllers/auth");

const rateLimiter = require("../helpers/ratelimiter");
const verifyToken = require("../helpers/verifytoken");
const router = express.Router();

router.get("/", [rateLimiter(1, 10), verifyToken], authController.health);

router.post("/register", authController.register);
router.post("/token", authController.token);
router.post("/confirm", verifyToken, authController.confirmEmailToken);
router.post("/login", authController.login);
router.post("/login", authController.resetPassword);
router.post("/login", authController.confirmPasswordReset);
module.exports = router;
