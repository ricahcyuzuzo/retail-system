const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// List all products
router.get('/', productController.listProducts);
// Add new product
router.post('/', productController.addProduct);
// Get product details
router.get('/:id', productController.getProduct);
// Update product
router.put('/:id', productController.updateProduct);
// Delete product
router.delete('/:id', productController.deleteProduct);
// Add product using barcode
router.post('/scan-barcode', productController.scanBarcode);

module.exports = router; 