const mongoose = require('mongoose');

const proformaItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  description: { type: String }
});

const proformaInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { 
    type: String, 
    unique: true 
  },
  customerName: { type: String, required: true },
  customerEmail: { type: String },
  customerPhone: { type: String },
  customerAddress: { type: String },
  items: [proformaItemSchema],
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'accepted', 'rejected', 'paid', 'expired'],
    default: 'draft'
  },
  validUntil: { type: Date },
  notes: { type: String },
  terms: { type: String },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  sentAt: { type: Date },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Generate invoice number
proformaInvoiceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (this.isNew && !this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.invoiceNumber = `PRO-${year}${month}${day}-${random}`;
  }
  
  next();
});

module.exports = mongoose.model('ProformaInvoice', proformaInvoiceSchema); 