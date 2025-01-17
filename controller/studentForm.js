const express = require('express');
const router = express.Router();
const StudentForm = require('../model/studentFormModel');
const { uploadStudent } = require('../utils/multerConfig');
const jwt = require('jsonwebtoken');

// Create a new student form
router.post('/student/submit-form', uploadStudent.single('profileImage'), async (req, res) => {
  try {
    // Get student ID from token
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentId = decoded._id;

    const formData = {
      ...req.body,
      student: studentId
    };
    
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
    console.error('Form submission error:', error);
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

// Get forms for specific student
router.get('/student/my-forms', async (req, res) => {
  try {
    // Get student ID from token
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentId = decoded._id;

    const forms = await StudentForm.find({ student: studentId })
      .sort({ submittedAt: -1 }); // Sort by submission date, newest first

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

// Get forms for a specific student (for admin view)
router.get('/students-forms/student/:studentId', async (req, res) => {
    try {
        // console.log('Fetching forms for student:', req.params.studentId); // Debug log
        const forms = await StudentForm.find({ student: req.params.studentId })
            .sort({ submittedAt: -1 });
        
        // console.log('Found forms:', forms); // Debug log

        res.status(200).json({
            success: true,
            data: forms
        });
    } catch (error) {
        // console.error('Error in /students-forms/student/:studentId:', error); // Debug log
        res.status(400).json({
            success: false,
            message: 'Failed to fetch forms',
            error: error.message
        });
    }
});

// Delete form
router.delete('/students-forms/:id', async (req, res) => {
    try {
        const form = await StudentForm.findByIdAndDelete(req.params.id);
        
        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Form deleted successfully',
            data: form
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete form',
            error: error.message
        });
    }
});

// Add this new route for editing forms
router.put('/students-forms/:id', async (req, res) => {
    try {
        const form = await StudentForm.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Form updated successfully',
            data: form
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update form',
            error: error.message
        });
    }
});

module.exports = router;
