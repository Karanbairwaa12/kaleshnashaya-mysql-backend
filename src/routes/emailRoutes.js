const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/send', emailController.sendEmail);
router.get('/history', emailController.getEmailHistory);
router.get('/history/:id', emailController.getEmailById);

module.exports = router;