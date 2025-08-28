const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Sale = require('../models/Sale');
const CreditSale = require('../models/CreditSale');
const CreditPurchase = require('../models/CreditPurchase');

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function aggregateToday(now = new Date()) {
  const start = startOfDay(now);
  const end = now; // run-time 21:00

  const sales = await Sale.find({ createdAt: { $gte: start, $lt: end } });
  const creditSales = await CreditSale.find({ createdAt: { $gte: start, $lt: end } });
  const creditPurchases = await CreditPurchase.find({ createdAt: { $gte: start, $lt: end } });

  const revenue =
    sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0) +
    creditSales.reduce((sum, cs) => sum + ((cs.totalAmount || 0) - (cs.outstanding || 0)), 0);

  const cost =
    sales.reduce((sum, s) => sum + ((s.purchasePrice || 0) * (s.quantity || 0)), 0) +
    creditSales.reduce((sum, cs) => sum + ((cs.purchasePrice || 0) * (cs.quantity || 0)), 0) +
    creditPurchases.reduce((sum, cp) => sum + (cp.totalAmount || 0), 0);

  const profit = revenue - cost;
  const loss = profit < 0 ? Math.abs(profit) : 0;

  return {
    start, end,
    revenue, cost, profit, loss,
    salesCount: sales.length,
    creditSalesCount: creditSales.length,
    creditPurchasesCount: creditPurchases.length,
  };
}

async function sendEmail(summary) {
  const {
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL,
    REPORT_EMAIL_TO, APP_NAME
  } = process.env;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: false,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  const brand = APP_NAME || 'Retail System';
  const to = REPORT_EMAIL_TO || FROM_EMAIL;
  if (!to) {
    console.warn('[dailySummary] No REPORT_EMAIL_TO/ FROM_EMAIL set; skip sending');
    return;
  }

  // Helpers
  const fmtCurrency = (n) => `RWF ${(n || 0).toLocaleString()}`;
  const formatLongDate = (d) => {
    const opt = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    try { return new Intl.DateTimeFormat(undefined, opt).format(d); } catch { return d.toDateString(); }
  };

  const dateLine = formatLongDate(summary.start);
  const subject = `${brand} • Daily Business Summary — ${dateLine}`;

  const statusText = summary.profit >= 0
    ? 'Business is running profitably today'
    : 'Business is running at a loss today';

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a">
    <div style="display:flex;align-items:center;gap:10px;margin:0 0 4px">
      <div style="width:20px;height:20px;border-radius:4px;background:#2563eb;display:flex;align-items:center;justify-content:center">
        <span style="font-size:12px;color:#fff">📊</span>
      </div>
      <h2 style="margin:0;font-size:22px;color:#0f172a">Daily Business Summary</h2>
    </div>
    <div style="margin:8px 0 16px;color:#334155">Date: ${dateLine}</div>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0" />
    <table cellpadding="10" cellspacing="0" style="width:100%;max-width:640px;border-collapse:collapse">
      <tbody>
        <tr>
          <td style="width:60%;color:#334155">💰 <strong>Total Sales (Today)</strong></td>
          <td style="text-align:right;color:#0f172a">${fmtCurrency(summary.revenue)}</td>
        </tr>
        <tr>
          <td style="color:#334155">🧾 <strong>Total Expenses (Today)</strong></td>
          <td style="text-align:right;color:#0f172a">${fmtCurrency(summary.cost)}</td>
        </tr>
        <tr>
          <td style="color:#334155">📈 <strong>Profit (Today)</strong></td>
          <td style="text-align:right;color:#0f172a">${fmtCurrency(summary.profit)}</td>
        </tr>
        <tr>
          <td style="color:#334155">📊 <strong>Overall Profit/Loss (to Date)</strong></td>
          <td style="text-align:right;color:#0f172a">—</td>
        </tr>
        <tr>
          <td style="color:#334155">✅ <strong>Status</strong></td>
          <td style="text-align:right;color:${summary.profit >= 0 ? '#16a34a' : '#dc2626'}">${statusText}</td>
        </tr>
      </tbody>
    </table>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0" />
    <div style="color:#64748b;font-size:12px">This message was sent automatically at 21:00.</div>
  </div>`;

  await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}

function scheduleDailySummary() {
  const timezone = process.env.TIMEZONE || process.env.TZ || 'Africa/Kigali';
  // Run every day at 21:00
  cron.schedule('0 21 * * *', async () => {
    try {
      const now = new Date();
      const summary = await aggregateToday(now);
      await sendEmail(summary);
      console.log('[dailySummary] Sent daily summary email for', summary.start.toDateString());
    } catch (err) {
      console.error('[dailySummary] Failed to send summary:', err);
    }
  }, { timezone });
  console.log(`[dailySummary] Scheduled daily summary at 21:00 (${timezone})`);
}

module.exports = { scheduleDailySummary };
