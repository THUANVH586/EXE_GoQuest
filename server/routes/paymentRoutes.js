const express = require('express');
const router = express.Router();
const { createPaymentLink, verifySuccess, handleWebhook } = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth');

router.post('/create-payment-link', authMiddleware, createPaymentLink);
router.post('/verify-success', authMiddleware, verifySuccess);
router.post('/webhook', handleWebhook);

module.exports = router;
