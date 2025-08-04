const Sale = require('../models/Sale');
const CreditSale = require('../models/CreditSale');
const CreditPurchase = require('../models/CreditPurchase');

function getDateRange(type) {
  const now = new Date();
  let start, end;
  if (type === 'daily') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (type === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else if (type === 'annual') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear() + 1, 0, 1);
  }
  return { start, end };
}

async function aggregateReport(start, end) {
  // Sales
  const sales = await Sale.find({ createdAt: { $gte: start, $lt: end } });
  const creditSales = await CreditSale.find({ createdAt: { $gte: start, $lt: end } });
  const creditPurchases = await CreditPurchase.find({ createdAt: { $gte: start, $lt: end } });

  // Revenue: regular sales + repayments on credit sales
  const revenue =
    sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0) +
    creditSales.reduce((sum, cs) => sum + (cs.totalAmount - cs.outstanding), 0);

  // Cost: all purchases (including credit purchases)
  const cost =
    sales.reduce((sum, s) => sum + ((s.purchasePrice || 0) * (s.quantity || 0)), 0) +
    creditSales.reduce((sum, cs) => sum + ((cs.purchasePrice || 0) * (cs.quantity || 0)), 0) +
    creditPurchases.reduce((sum, cp) => sum + (cp.totalAmount || 0), 0);

  // Profit
  const profit = revenue - cost;

  // Loss (if negative profit)
  const loss = profit < 0 ? Math.abs(profit) : 0;

  return {
    revenue,
    cost,
    profit,
    loss,
    salesCount: sales.length,
    creditSalesCount: creditSales.length,
    creditPurchasesCount: creditPurchases.length,
    sales,
    creditSales,
    creditPurchases
  };
}

exports.getDailyReport = async (req, res) => {
  try {
    const { start, end } = getDateRange('daily');
    const report = await aggregateReport(start, end);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMonthlyReport = async (req, res) => {
  try {
    const { start, end } = getDateRange('monthly');
    const report = await aggregateReport(start, end);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAnnualReport = async (req, res) => {
  try {
    const { start, end } = getDateRange('annual');
    const report = await aggregateReport(start, end);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getCustomReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const report = await aggregateReport(start, end);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 