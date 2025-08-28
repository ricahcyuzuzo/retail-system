const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/daily', reportController.getDailyReport);
router.get('/weekly', reportController.getWeeklyReport);
router.get('/monthly', reportController.getMonthlyReport);
router.get('/annual', reportController.getAnnualReport);
router.post('/custom', reportController.getCustomReport);

// PDF endpoints
router.get('/daily/pdf', reportController.getDailyReportPdf);
router.get('/weekly/pdf', reportController.getWeeklyReportPdf);
router.get('/monthly/pdf', reportController.getMonthlyReportPdf);
router.get('/annual/pdf', reportController.getAnnualReportPdf);
router.post('/custom/pdf', reportController.getCustomReportPdf);

module.exports = router;