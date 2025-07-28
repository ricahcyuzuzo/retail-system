const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AccessRequest = require('../models/AccessRequest');

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
    const user = new User({ email, password: hashed, isAdmin: !!isAdmin });
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
    res.json({ message: `Request ${approve ? 'approved' : 'rejected'}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
