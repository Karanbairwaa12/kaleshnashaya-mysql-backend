const express = require('express');
const router = express.Router();
const passport = require("../config/oauth")
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email", 'https://www.googleapis.com/auth/gmail.send'],
    accessType: 'offline',
    prompt: 'consent'
}))

router.get("/google/callback", passport.authenticate("google", {
    failureRedirect: "/auth/google/failure"
}), authController.googleCallback);

router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
