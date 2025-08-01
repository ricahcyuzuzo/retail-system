const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

// Record a new sale
router.post('/', saleController.recordSale);
// List all sales
router.get('/', saleController.listSales);
// Get sale details
router.get('/:id', saleController.getSaleDetails);

module.exports = router; 