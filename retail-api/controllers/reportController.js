const Sale = require('../models/Sale');
const CreditSale = require('../models/CreditSale');
const CreditPurchase = require('../models/CreditPurchase');
const PDFDocument = require('pdfkit');

function getDateRange(type) {
  const now = new Date();
  let start, end;
  if (type === 'daily') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (type === 'weekly') {
    // Monday as start of week
    const dow = now.getDay(); // 0=Sun, 1=Mon, ...
    const deltaToMon = (dow + 6) % 7; // 0 if Mon
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - deltaToMon);
    start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  } else if (type === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else if (type === 'annual') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear() + 1, 0, 1);
  }
  return { start, end };
}

// ---- PDF helper ----
function renderReportPdf(doc, report, meta) {
  const brand = process.env.APP_NAME || 'Retail System';
  const currency = 'RWF';
  const textDark = '#0f172a';
  const textMuted = '#334155';
  const ruleColor = '#e2e8f0';

  // Helpers
  const fmtCurrency = (n) => `${(n || 0).toLocaleString()} ${currency}`;
  const formatLongDate = (d) => {
    const opt = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    try { return new Intl.DateTimeFormat(undefined, opt).format(d); } catch { return d.toDateString(); }
  };

  // Title
  const title = `${meta.title} Business Summary`;
  doc.fill(textDark).font('Helvetica-Bold').fontSize(22).text(title, 40, 40);

  // Date line
  let dateLine = meta.period;
  if (meta.title === 'Daily') {
    // For daily, show a single long date for start
    const [startStr] = meta.period.split(' - ');
    dateLine = `Date: ${formatLongDate(new Date(startStr))}`;
  } else {
    dateLine = `Period: ${meta.period}`;
  }
  doc.fill(textMuted).font('Helvetica').fontSize(12).text(dateLine, 40, 72);

  // Rule
  doc.moveTo(40, 96).lineTo(doc.page.width - 40, 96).strokeColor(ruleColor).lineWidth(1).stroke();

  // Two-column labeled rows
  const startY = 116;
  const leftX = 40;
  const rightX = doc.page.width - 200;
  const rowH = 26;
  const periodSuffix = meta.title === 'Daily'
    ? 'Today'
    : meta.title === 'Weekly'
    ? 'This Week'
    : meta.title === 'Monthly'
    ? 'This Month'
    : meta.title === 'Annual'
    ? 'This Year'
    : 'Selected Period';

  const rows = [
    { label: `Total Sales (${periodSuffix})`, value: fmtCurrency(report.revenue) },
    { label: `Total Expenses (${periodSuffix})`, value: fmtCurrency(report.cost) },
    { label: `Profit (${periodSuffix})`, value: fmtCurrency(report.profit) },
    { label: 'Overall Profit/Loss (to Date)', value: '—' },
    { label: 'Status', value: report.profit >= 0 ? 'Business is running profitably' : 'Business is running at a loss' },
  ];
  let y = startY;
  rows.forEach(r => {
    doc.fill(textMuted).font('Helvetica-Bold').fontSize(12).text(r.label, leftX, y);
    doc.fill(textDark).font('Helvetica').fontSize(12).text(r.value, rightX, y, { align: 'right', width: 160 });
    y += rowH;
  });

  // Bottom rule
  doc.moveTo(40, y + 6).lineTo(doc.page.width - 40, y + 6).strokeColor(ruleColor).lineWidth(1).stroke();

  // Footer
  doc.fill('#64748b').fontSize(10).text(`${brand}`, 40, doc.page.height - 40, { width: doc.page.width - 80, align: 'center' });
}

async function streamReportPdf(res, title, start, end) {
  const report = await aggregateReport(start, end);
  res.setHeader('Content-Type', 'application/pdf');
  const sanitize = (s = '') => String(s).replace(/[^a-z0-9-_]+/gi, '_');
  const startStr = start.toISOString().slice(0,10);
  const endStr = end.toISOString().slice(0,10);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `report-${sanitize(title.toLowerCase())}-${startStr}-${endStr}-${timestamp}.pdf`;
  const encoded = encodeURIComponent(filename);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encoded}`);
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  const period = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  renderReportPdf(doc, report, { title, period });
  doc.end();
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

exports.getWeeklyReport = async (req, res) => {
  try {
    const { start, end } = getDateRange('weekly');
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

// ---- PDF endpoints ----
exports.getDailyReportPdf = async (req, res) => {
  try {
    const { start, end } = getDateRange('daily');
    await streamReportPdf(res, 'Daily', start, end);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getWeeklyReportPdf = async (req, res) => {
  try {
    const { start, end } = getDateRange('weekly');
    await streamReportPdf(res, 'Weekly', start, end);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMonthlyReportPdf = async (req, res) => {
  try {
    const { start, end } = getDateRange('monthly');
    await streamReportPdf(res, 'Monthly', start, end);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAnnualReportPdf = async (req, res) => {
  try {
    const { start, end } = getDateRange('annual');
    await streamReportPdf(res, 'Annual', start, end);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getCustomReportPdf = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    await streamReportPdf(res, 'Custom', start, end);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};