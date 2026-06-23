const express = require('express');
const router = express.Router();
const { getChildren, getChildById, createChild, updateChild, deleteChild } = require('../controllers/childController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getChildren)
  .post(protect, authorizeRoles('Admin', 'Parent'), createChild);

router.route('/:id')
  .get(protect, getChildById)
  .put(protect, authorizeRoles('Admin', 'Parent', 'School Staff'), updateChild)
  .delete(protect, authorizeRoles('Admin'), deleteChild);

module.exports = router;
