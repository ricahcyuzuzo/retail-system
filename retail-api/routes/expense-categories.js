const express = require('express');
const router = express.Router();
const expenseCategoryController = require('../controllers/expenseCategoryController');

router.get('/', expenseCategoryController.listCategories);
router.post('/', expenseCategoryController.addCategory);
router.put('/:id', expenseCategoryController.updateCategory);
router.delete('/:id', expenseCategoryController.deleteCategory);

module.exports = router; 