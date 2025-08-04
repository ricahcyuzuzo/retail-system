require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const creditSalesRoutes = require('./routes/credit-sales');
const suppliersRoutes = require('./routes/suppliers');
const creditPurchasesRoutes = require('./routes/credit-purchases');
const reportsRoutes = require('./routes/reports');
const expensesRoutes = require('./routes/expenses');
const expenseCategoriesRoutes = require('./routes/expense-categories');
const proformasRoutes = require('./routes/proformas');
const setupWebSocket = require('./websocket');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/credit-sales', creditSalesRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/credit-purchases', creditPurchasesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/expense-categories', expenseCategoriesRoutes);
app.use('/api/proformas', proformasRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/retail-api';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    setupWebSocket(server);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
