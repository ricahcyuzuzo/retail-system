const Sale = require('../models/Sale');
const Product = require('../models/Product');

exports.recordSale = async (req, res) => {
  try {
    const { productId, quantity, saleType, customerName, customerPhone } = req.body;
    
    // Validate required fields
    if (!productId || !quantity || !saleType) {
      return res.status(400).json({ message: 'Product ID, quantity, and sale type are required' });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check inventory
    if (product.inventory < quantity) {
      return res.status(400).json({ message: 'Insufficient inventory' });
    }

    // Calculate prices and profit
    const unitPrice = saleType === 'wholesale' ? product.wholesalePrice || product.retailPrice : product.retailPrice;
    const totalAmount = unitPrice * quantity;
    const costPrice = product.purchasePrice * quantity;
    const profit = totalAmount - costPrice;

    // Create sale record
    const sale = new Sale({
      productId,
      productName: product.name,
      quantity,
      unitPrice,
      totalAmount,
      saleType,
      profit,
      customerName,
      customerPhone
    });

    await sale.save();

    // Update product inventory
    product.inventory -= quantity;
    await product.save();

    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.listSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSaleDetails = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 