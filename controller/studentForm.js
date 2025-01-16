const express = require('express');
const router = express.Router();
const StudentForm = require('../model/studentFormModel');
const { uploadStudent } = require('../utils/multerConfig');

// Create a new student form
router.post('/students-forms', uploadStudent.single('profileImage'), async (req, res) => {
  try {
    const formData = req.body;
    
    // Add profile image path if uploaded
    if (req.file) {
      formData.profileImage = req.file.path;
    }

    const studentForm = new StudentForm(formData);
    await studentForm.save();

    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: studentForm
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Form submission failed',
      error: error.message
    });
  }
});

// Get all forms
router.get('/students-forms', async (req, res) => {
  try {
    const forms = await StudentForm.find();
    res.status(200).json({
      success: true,
      data: forms
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to fetch forms',
      error: error.message
    });
  }
});

// Get form by ID
router.get('/students-forms/:id', async (req, res) => {
  try {
    const form = await StudentForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }
    res.status(200).json({
      success: true,
      data: form
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to fetch form',
      error: error.message
    });
  }
});

// Update form status
router.patch('/students-forms/:id', async (req, res) => {
  try {
    const form = await StudentForm.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }
    res.status(200).json({
      success: true,
      data: form
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update form status',
      error: error.message
    });
  }
});

module.exports = router;

