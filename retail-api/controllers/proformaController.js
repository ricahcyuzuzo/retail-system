const ProformaInvoice = require('../models/ProformaInvoice');
const Product = require('../models/Product');
const User = require('../models/User');

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