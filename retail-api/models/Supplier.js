const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  contactPerson: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

supplierSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Supplier', supplierSchema); 