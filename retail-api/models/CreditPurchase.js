const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paidAt: { type: Date, default: Date.now }
});

const creditPurchaseSchema = new mongoose.Schema({
  supplierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Supplier', 
    required: true 
  },
  supplierName: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  payments: [paymentSchema],
  outstanding: { type: Number, required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

creditPurchaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CreditPurchase', creditPurchaseSchema); 