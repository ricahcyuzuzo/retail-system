const CreditSale = require('../models/CreditSale');
const Product = require('../models/Product');

exports.recordCreditSale = async (req, res) => {
  try {
    const { productId, quantity, saleType, customerName, customerPhone, dueDate } = req.body;
    if (!productId || !quantity || !saleType || !customerName || !dueDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.inventory < quantity) return res.status(400).json({ message: 'Insufficient inventory' });
    const unitPrice = saleType === 'wholesale' ? product.wholesalePrice || product.retailPrice : product.retailPrice;
    const totalAmount = unitPrice * quantity;
    const outstanding = totalAmount;
    const creditSale = new CreditSale({
      productId,
      productName: product.name,
      quantity,
      unitPrice,
      totalAmount,
      saleType,
      customerName,
      customerPhone,
      dueDate,
      outstanding,
      payments: []
    });
    await creditSale.save();
    product.inventory -= quantity;
    await product.save();
    res.status(201).json(creditSale);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.listCreditSales = async (req, res) => {
  try {
    const sales = await CreditSale.find().sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCreditSaleDetails = async (req, res) => {
  try {
    const sale = await CreditSale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Credit sale not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listCustomerBalances = async (req, res) => {
  try {
    const sales = await CreditSale.find();
    const balances = {};
    sales.forEach(sale => {
      if (!balances[sale.customerName]) {
        balances[sale.customerName] = { customerPhone: sale.customerPhone, totalOutstanding: 0 };
      }
      balances[sale.customerName].totalOutstanding += sale.outstanding;
    });
    res.json(Object.entries(balances).map(([customerName, data]) => ({ customerName, ...data })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.recordPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid payment amount' });
    const sale = await CreditSale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Credit sale not found' });
    sale.payments.push({ amount });
    sale.outstanding -= amount;
    if (sale.outstanding < 0) sale.outstanding = 0;
    await sale.save();
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 