const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/daily', reportController.getDailyReport);
router.get('/monthly', reportController.getMonthlyReport);
router.get('/annual', reportController.getAnnualReport);
router.post('/custom', reportController.getCustomReport);

module.exports = router; 