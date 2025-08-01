const Supplier = require('../models/Supplier');

exports.listSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addSupplier = async (req, res) => {
  try {
    const { name, phone, email, address, contactPerson } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    const supplier = new Supplier({
      name,
      phone,
      email,
      address,
      contactPerson
    });

    await supplier.save();
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}; 