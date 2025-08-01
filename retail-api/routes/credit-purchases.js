const express = require('express');
const router = express.Router();
const creditPurchaseController = require('../controllers/creditPurchaseController');

// Record credit purchase
router.post('/', creditPurchaseController.recordCreditPurchase);
// List all credit purchases
router.get('/', creditPurchaseController.listCreditPurchases);
// Get credit purchase details
router.get('/:id', creditPurchaseController.getCreditPurchaseDetails);
// Record payment on a credit purchase
router.put('/:id/pay', creditPurchaseController.recordPayment);

module.exports = router; 