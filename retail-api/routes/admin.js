const express = require('express');
const { createUser, enableUser, disableUser, getAccessRequests, respondAccessRequest } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();

// All admin routes require authentication and admin role
router.post('/user', authMiddleware, adminMiddleware, createUser);
router.patch('/user/:id/enable', authMiddleware, adminMiddleware, enableUser);
router.patch('/user/:id/disable', authMiddleware, adminMiddleware, disableUser);

// Access request management
router.get('/access-requests', authMiddleware, adminMiddleware, getAccessRequests);
router.post('/access-requests/:id/respond', authMiddleware, adminMiddleware, respondAccessRequest);

module.exports = router;
