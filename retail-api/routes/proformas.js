const express = require('express');
const router = express.Router();
const proformaController = require('../controllers/proformaController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create new proforma invoice
router.post('/', proformaController.createProforma);

// List all proforma invoices
router.get('/', proformaController.listProformas);

// Get proforma invoice details
router.get('/:id', proformaController.getProformaDetails);

// Update proforma invoice status
router.put('/:id/status', proformaController.updateProformaStatus);

// Send proforma invoice
router.put('/:id/send', proformaController.sendProforma);

// Generate and download proforma PDF
router.get('/:id/pdf', proformaController.generateProformaPdf);

// Send proforma via email with PDF attachment
router.post('/:id/email', proformaController.emailProforma);

module.exports = router;