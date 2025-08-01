const express = require('express');
const router = express.Router();
const creditSaleController = require('../controllers/creditSaleController');

// Record a new credit sale
router.post('/', creditSaleController.recordCreditSale);
// List all credit sales
router.get('/', creditSaleController.listCreditSales);
// List credit balances by customer (must come before /:id)
router.get('/customers', creditSaleController.listCustomerBalances);
// Get credit sale details
router.get('/:id', creditSaleController.getCreditSaleDetails);
// Record payment on a credit sale
router.put('/:id/pay', creditSaleController.recordPayment);

module.exports = router; 