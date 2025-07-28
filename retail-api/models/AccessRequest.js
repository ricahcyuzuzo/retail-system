const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
  responderEmail: { type: String },
  action: { type: String } // approved/rejected
});

module.exports = mongoose.model('AccessRequest', accessRequestSchema);
