const express = require('express');
const { createUser, enableUser, disableUser, getAccessRequests, respondAccessRequest, createAccessRequest, checkAccessStatus, getUsers, toggleDesktopAccess, getDesktopAccessState, setDesktopAccessState } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();

// Desktop access state (single desktop)
router.get('/desktop-access', getDesktopAccessState); // No auth, for desktop polling
router.post('/desktop-access', authMiddleware, adminMiddleware, setDesktopAccessState); // Admin only

// All admin routes require authentication and admin role
router.get('/users', authMiddleware, adminMiddleware, getUsers);
router.post('/user', authMiddleware, adminMiddleware, createUser);
router.patch('/user/:id/enable', authMiddleware, adminMiddleware, enableUser);
router.patch('/user/:id/disable', authMiddleware, adminMiddleware, disableUser);
router.patch('/user/:id/desktop-access', authMiddleware, adminMiddleware, toggleDesktopAccess);

// Access request management
router.get('/access-requests', authMiddleware, adminMiddleware, getAccessRequests);
router.post('/access-requests', createAccessRequest); // No auth required for desktop app
router.get('/access-requests/status/:userEmail', checkAccessStatus); // No auth required for desktop app
router.post('/access-requests/:id/respond', authMiddleware, adminMiddleware, respondAccessRequest);

module.exports = router;
