const CreditPurchase = require('../models/CreditPurchase');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

exports.recordCreditPurchase = async (req, res) => {
  try {
    const { supplierId, productName, quantity, unitPrice, dueDate, notes } = req.body;
    
    if (!supplierId || !productName || !quantity || !unitPrice || !dueDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const totalAmount = unitPrice * quantity;
    const outstanding = totalAmount;

    const creditPurchase = new CreditPurchase({
      supplierId,
      supplierName: supplier.name,
      productName,
      quantity,
      unitPrice,
      totalAmount,
      dueDate,
      outstanding,
      notes,
      payments: []
    });

    await creditPurchase.save();

    // Update or create product inventory
    let product = await Product.findOne({ name: productName });
    if (!product) {
      product = new Product({
        name: productName,
        purchasePrice: unitPrice,
        retailPrice: unitPrice * 1.3, // 30% markup
        inventory: 0
      });
    }
    
    product.inventory += quantity;
    await product.save();

    res.status(201).json(creditPurchase);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.listCreditPurchases = async (req, res) => {
  try {
    const purchases = await CreditPurchase.find().sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCreditPurchaseDetails = async (req, res) => {
  try {
    const purchase = await CreditPurchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Credit purchase not found' });
    }
    res.json(purchase);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.recordPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const purchase = await CreditPurchase.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Credit purchase not found' });
    }

    purchase.payments.push({ amount });
    purchase.outstanding -= amount;
    if (purchase.outstanding < 0) purchase.outstanding = 0;
    
    await purchase.save();
    res.json(purchase);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 