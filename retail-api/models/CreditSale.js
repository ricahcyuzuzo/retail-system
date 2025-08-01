const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paidAt: { type: Date, default: Date.now }
});

const creditSaleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  saleType: { type: String, enum: ['retail', 'wholesale'], required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  dueDate: { type: Date, required: true },
  payments: [paymentSchema],
  outstanding: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

creditSaleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CreditSale', creditSaleSchema); 