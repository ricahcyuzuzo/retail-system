const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

// List all suppliers
router.get('/', supplierController.listSuppliers);
// Add supplier info
router.post('/', supplierController.addSupplier);

module.exports = router; 