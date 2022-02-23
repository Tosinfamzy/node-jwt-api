const express = require('express')
const authController = require('../controllers/auth')
const router = express.Router()

router.get('/', authController.test)

module.exports = router