const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AccessRequest = require('../models/AccessRequest');
const DesktopAccessState = require('../models/DesktopAccessState');

exports.createUser = async (req, res) => {
  const { email, password, isAdmin } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed, isAdmin: isAdmin });
    await user.save();
    res.status(201).json({ message: 'User created', user: { email: user.email, isAdmin: user.isAdmin, isActive: user.isActive } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.enableUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndUpdate(id, { isActive: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User enabled', user: { email: user.email, isActive: user.isActive } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.disableUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User disabled', user: { email: user.email, isActive: user.isActive } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// REST API: Get all access requests (optionally filter by status)
exports.getAccessRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await AccessRequest.find(filter).sort({ requestedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// REST API: Approve or reject an access request
exports.respondAccessRequest = async (req, res) => {
  const { id } = req.params;
  const { approve } = req.body;
  const adminEmail = req.user.email;
  try {
    const reqDoc = await AccessRequest.findById(id);
    if (!reqDoc || reqDoc.status !== 'pending') {
      return res.status(404).json({ message: 'Request not found or already handled' });
    }
    reqDoc.status = approve ? 'approved' : 'rejected';
    reqDoc.respondedAt = new Date();
    reqDoc.responderEmail = adminEmail;
    reqDoc.action = approve ? 'approved' : 'rejected';
    await reqDoc.save();
    if (approve) {
      await User.findOneAndUpdate({ email: reqDoc.userEmail }, { isActive: true });
    }
    // Notify desktop client via WebSocket if possible
    try {
      const { pendingRequests, wss } = require('../websocket');
      const wsClient = pendingRequests.get(id);
      if (wsClient && wsClient.readyState === 1) { // 1 = OPEN
        wsClient.send(JSON.stringify({ type: 'access_response', approved: approve }));
        pendingRequests.delete(id);
      }
    } catch (e) { /* ignore if not present */ }
    res.json({ message: `Request ${approve ? 'approved' : 'rejected'}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create access request (for desktop app)
exports.createAccessRequest = async (req, res) => {
  const { userEmail } = req.body;
  if (!userEmail) {
    return res.status(400).json({ message: 'User email is required' });
  }
  try {
    const existingRequest = await AccessRequest.findOne({ 
      userEmail, 
      status: 'pending' 
    });
    
    if (existingRequest) {
      return res.status(200).json({ 
        message: 'Access request already exists', 
        requestId: existingRequest._id 
      });
    }

    const request = new AccessRequest({ userEmail });
    await request.save();
    res.status(201).json({ 
      message: 'Access request created', 
      requestId: request._id 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Check access status (for desktop app polling)
exports.checkAccessStatus = async (req, res) => {
  const { userEmail } = req.params;
  try {
    const request = await AccessRequest.findOne({ 
      userEmail: decodeURIComponent(userEmail) 
    }).sort({ requestedAt: -1 });
    
    if (!request) {
      return res.status(404).json({ message: 'No access request found' });
    }
    
    res.json({ 
      status: request.status,
      requestedAt: request.requestedAt,
      respondedAt: request.respondedAt
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users (for mobile app)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ email: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle desktop access for a user
exports.toggleDesktopAccess = async (req, res) => {
  const { id } = req.params;
  const { canAccessDesktop } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      id, 
      { canAccessDesktop }, 
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ 
      message: 'Desktop access updated', 
      user: { 
        _id: user._id,
        email: user.email, 
        canAccessDesktop: user.canAccessDesktop 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current desktop access state
exports.getDesktopAccessState = async (req, res) => {
  try {
    let state = await DesktopAccessState.findOne();
    if (!state) {
      state = new DesktopAccessState({ isOpen: false });
      await state.save();
    }
    res.json({ isOpen: state.isOpen });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Set desktop access state (open/close)
exports.setDesktopAccessState = async (req, res) => {
  const { isOpen } = req.body;
  if (typeof isOpen !== 'boolean') {
    return res.status(400).json({ message: 'isOpen must be boolean' });
  }
  try {
    let state = await DesktopAccessState.findOne();
    if (!state) {
      state = new DesktopAccessState({ isOpen });
    } else {
      state.isOpen = isOpen;
      state.updatedAt = new Date();
    }
    await state.save();
    res.json({ isOpen: state.isOpen });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
