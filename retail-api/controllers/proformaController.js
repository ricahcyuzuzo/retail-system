const ProformaInvoice = require('../models/ProformaInvoice');
const Product = require('../models/Product');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

// Create new proforma invoice
exports.createProforma = async (req, res) => {
  try {
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      customerAddress, 
      items, 
      taxAmount = 0, 
      discountAmount = 0, 
      currency = 'USD',
      validUntil,
      notes,
      terms 
    } = req.body;

    // Validate required fields
    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: 'Customer name and at least one item are required' 
      });
    }

    // Validate and process items
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      if (!item.productId || !item.quantity || !item.unitPrice) {
        return res.status(400).json({ 
          message: 'Each item must have productId, quantity, and unitPrice' 
        });
      }

      // Get product details
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          message: `Product with ID ${item.productId} not found` 
        });
      }

      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;

      processedItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice,
        description: item.description || product.description
      });
    }

    const totalAmount = subtotal + taxAmount - discountAmount;


    
    // Check if user ID is available, if not try to find user by email
    let userId = req.user.id;
    if (!userId && req.user.email) {
      try {
        const user = await User.findOne({ email: req.user.email });
        if (user) {
          userId = user._id;
        }
      } catch (error) {
        console.error('Error finding user by email:', error);
      }
    }
    
    if (!userId) {
      return res.status(400).json({ 
        message: 'User authentication required. Please log in again.' 
      });
    }
    
    // Create proforma invoice
    const proformaInvoice = new ProformaInvoice({
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items: processedItems,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      currency,
      validUntil: validUntil ? new Date(validUntil) : null,
      notes,
      terms,
      createdBy: userId
    });

    await proformaInvoice.save();

    res.status(201).json(proformaInvoice);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ---- PDF Rendering Helper ----
function renderProformaPdf(doc, proforma) {
  const currency = proforma.currency || 'RWF';
  const brand = process.env.APP_NAME || 'Retail System';

  // Colors & layout
  const primary = '#10B981'; // green-500
  const textDark = '#111827'; // gray-900
  const textLight = '#6B7280'; // gray-500

  // Header Bar
  doc.rect(0, 0, doc.page.width, 80).fill(primary);
  doc.fill('#ffffff').fontSize(20).font('Helvetica-Bold').text(brand, 40, 28, { continued: true });
  doc.fontSize(12).font('Helvetica').text('Proforma Invoice', { align: 'right', width: doc.page.width - 80 });

  // Meta Info
  doc.moveDown(2);
  doc.fill(textDark).fontSize(11);
  const created = proforma.createdAt ? new Date(proforma.createdAt) : new Date();
  const metaY = 100;
  doc.text(`Proforma #: ${proforma._id}`, 40, metaY);
  doc.text(`Date: ${created.toLocaleDateString()}`, 40, metaY + 16);
  if (proforma.validUntil) doc.text(`Valid Until: ${new Date(proforma.validUntil).toLocaleDateString()}`, 40, metaY + 32);

  // Customer Box
  const boxX = 300;
  const boxY = 92;
  const boxW = doc.page.width - boxX - 40;
  const boxH = 80;
  doc.roundedRect(boxX, boxY, boxW, boxH, 8).strokeColor(primary).lineWidth(1).stroke();
  doc.fillColor(textLight).fontSize(10).text('Bill To', boxX + 10, boxY + 8);
  doc.fillColor(textDark).fontSize(11);
  let y = boxY + 26;
  const lines = [
    proforma.customerName,
    proforma.customerEmail,
    proforma.customerPhone,
    proforma.customerAddress
  ].filter(Boolean);
  lines.forEach((l) => { doc.text(l, boxX + 10, y); y += 16; });

  // Items Table
  const tableTop = 200;
  const col = {
    product: 40,
    qty: 280,
    unit: 340,
    total: 440
  };
  // Header background
  doc.fillColor('#F3F4F6').rect(40, tableTop, doc.page.width - 80, 28).fill();
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(11)
    .text('Product', col.product, tableTop + 8)
    .text('Qty', col.qty, tableTop + 8, { width: 40 })
    .text('Unit Price', col.unit, tableTop + 8, { width: 80 })
    .text('Total', col.total, tableTop + 8, { width: 80, align: 'left' });

  // Rows
  doc.font('Helvetica').fontSize(10);
  let rowY = tableTop + 36;
  proforma.items.forEach((item, idx) => {
    // zebra stripe
    if (idx % 2 === 0) {
      doc.fillColor('#FFFFFF');
    } else {
      doc.fillColor('#FAFAFA');
    }
    doc.rect(40, rowY - 6, doc.page.width - 80, 24).fill();

    doc.fillColor(textDark)
      .text(item.productName || '', col.product, rowY)
      .text(String(item.quantity), col.qty, rowY, { width: 40 })
      .text(`${(item.unitPrice || 0).toLocaleString()} ${currency}`, col.unit, rowY, { width: 90 })
      .text(`${(item.totalPrice || 0).toLocaleString()} ${currency}`, col.total, rowY, { width: 90 });
    rowY += 24;
  });

  // Grid lines
  doc.strokeColor('#E5E7EB').lineWidth(0.5);
  let gridY = tableTop + 28;
  while (gridY < rowY) {
    doc.moveTo(40, gridY).lineTo(doc.page.width - 40, gridY).stroke();
    gridY += 24;
  }

  // Totals Box
  const totalsTop = rowY + 16;
  const totalsX = 320;
  const totalsW = doc.page.width - totalsX - 40;
  doc.roundedRect(totalsX, totalsTop, totalsW, 110, 8).strokeColor('#E5E7EB').stroke();

  // Draw totals as aligned rows
  const totalRows = [];
  totalRows.push({ label: 'Subtotal:', value: proforma.subtotal || 0, bold: false });
  if ((proforma.taxAmount || 0) > 0) totalRows.push({ label: 'Tax:', value: proforma.taxAmount || 0, bold: false });
  if ((proforma.discountAmount || 0) > 0) totalRows.push({ label: 'Discount:', value: -(proforma.discountAmount || 0), bold: false });
  totalRows.push({ label: 'Total:', value: proforma.totalAmount || 0, bold: true });

  const rowHeight = 22;
  let ty = totalsTop + 12;
  totalRows.forEach(r => {
    doc.font(r.bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(textDark).fontSize(11);
    // label column
    doc.text(r.label, totalsX + 16, ty, { width: totalsW - 140, align: 'right' });
    // value column
    doc.text(`${r.value.toLocaleString()} ${currency}`, totalsX + 16, ty, { width: totalsW - 24, align: 'right' });
    ty += rowHeight;
  });

  // Notes
  const notesTop = totalsTop + 120;
  if (proforma.notes) {
    doc.moveTo(40, notesTop).lineTo(doc.page.width - 40, notesTop).strokeColor('#E5E7EB').stroke();
    doc.fillColor(textLight).font('Helvetica-Bold').fontSize(11).text('Notes', 40, notesTop + 12);
    doc.fillColor(textDark).font('Helvetica').fontSize(10).text(proforma.notes, 40, notesTop + 30, { width: doc.page.width - 80 });
  }

  // Footer
  doc.fillColor(textLight).fontSize(9).text(`${brand} • Generated on ${new Date().toLocaleString()}`, 40, doc.page.height - 40, { width: doc.page.width - 80, align: 'center' });
}

// Generate proforma PDF and stream to client
exports.generateProformaPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const proforma = await ProformaInvoice.findById(id);
    if (!proforma) {
      return res.status(404).json({ message: 'Proforma invoice not found' });
    }

    const sanitize = (s = '') => String(s).replace(/[^a-z0-9-_]+/gi, '_');
    const dateStr = new Date(proforma.createdAt || Date.now()).toISOString().slice(0,10);
    const customer = sanitize(proforma.customerName || 'customer');
    const number = sanitize(proforma.invoiceNumber || id);
    const filename = `proforma-${number}-${customer}-${dateStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    const encoded = encodeURIComponent(filename);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encoded}`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    renderProformaPdf(doc, proforma);

    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
  }
};

// Send proforma via email with PDF attachment
exports.emailProforma = async (req, res) => {
  try {
    const { id } = req.params;
    const proforma = await ProformaInvoice.findById(id);
    if (!proforma) {
      return res.status(404).json({ message: 'Proforma invoice not found' });
    }
    if (!proforma.customerEmail) {
      return res.status(400).json({ message: 'Customer email is required to send proforma' });
    }

    // Configure transporter via environment variables
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      FROM_EMAIL
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !FROM_EMAIL) {
      return res.status(500).json({ message: 'Email is not configured on the server' });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });

    // Generate PDF into buffer
    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      doc.on('data', (d) => chunks.push(d));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      renderProformaPdf(doc, proforma);
      doc.end();
    });

    // Update status to sent (if draft) before queuing email
    if (proforma.status === 'draft') {
      proforma.status = 'sent';
      proforma.sentAt = new Date();
      await proforma.save();
    }

    // Send email asynchronously (do not block request)
    setImmediate(async () => {
      try {
        await transporter.sendMail({
          from: FROM_EMAIL,
          to: proforma.customerEmail,
          subject: `Proforma Invoice ${proforma._id}`,
          text: 'Please find attached your proforma invoice.',
          attachments: [
            { filename: `proforma-${proforma._id}.pdf`, content: pdfBuffer }
          ]
        });
      } catch (err) {
        console.error('Async email send failed:', err);
      }
    });

    res.status(202).json({ message: 'Email queued' });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ message: 'Failed to send email', error: err.message });
  }
};

// List all proforma invoices
exports.listProformas = async (req, res) => {
  try {
    const { status, customerName, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (customerName) {
      filter.customerName = { $regex: customerName, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    
    const proformas = await ProformaInvoice.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ProformaInvoice.countDocuments(filter);

    res.json({
      proformas,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get proforma invoice details
exports.getProformaDetails = async (req, res) => {
  try {
    const proforma = await ProformaInvoice.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('items.productId', 'name description');

    if (!proforma) {
      return res.status(404).json({ message: 'Proforma invoice not found' });
    }

    res.json(proforma);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update proforma invoice status
exports.updateProformaStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Validate status
    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'paid', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      });
    }

    const proforma = await ProformaInvoice.findById(id);
    if (!proforma) {
      return res.status(404).json({ message: 'Proforma invoice not found' });
    }

    // Update status and related timestamps
    proforma.status = status;
    
    if (status === 'sent' && !proforma.sentAt) {
      proforma.sentAt = new Date();
    }
    
    if (status === 'paid' && !proforma.paidAt) {
      proforma.paidAt = new Date();
    }

    await proforma.save();

    res.json(proforma);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Send proforma invoice (update status to sent)
exports.sendProforma = async (req, res) => {
  try {
    const { id } = req.params;
    
    const proforma = await ProformaInvoice.findById(id);
    if (!proforma) {
      return res.status(404).json({ message: 'Proforma invoice not found' });
    }

    if (proforma.status !== 'draft') {
      return res.status(400).json({ 
        message: 'Only draft invoices can be sent' 
      });
    }

    proforma.status = 'sent';
    proforma.sentAt = new Date();
    await proforma.save();

    res.json(proforma);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 