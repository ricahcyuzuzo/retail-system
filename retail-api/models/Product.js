const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  barcode: { type: String, unique: true, sparse: true },
  purchasePrice: { type: Number, required: true },
  retailPrice: { type: Number, required: true },
  wholesalePrice: { type: Number },
  inventory: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema); 