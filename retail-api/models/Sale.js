const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  saleType: { 
    type: String, 
    enum: ['retail', 'wholesale'], 
    required: true 
  },
  profit: { type: Number, required: true },
  customerName: { type: String },
  customerPhone: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

saleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Sale', saleSchema); 