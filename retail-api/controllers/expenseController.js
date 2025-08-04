const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');

exports.listExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().populate('category').sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('category');
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const { description, amount, category, type, date } = req.body;
    if (!description || !amount || !category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const expense = new Expense({ description, amount, category, type, date });
    await expense.save();
    await expense.populate('category');
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { description, amount, category, type, date } = req.body;
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { description, amount, category, type, date, updatedAt: Date.now() },
      { new: true }
    ).populate('category');
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 