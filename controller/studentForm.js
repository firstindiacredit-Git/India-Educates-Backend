const express = require('express');
const router = express.Router();
const StudentForm = require('../model/studentFormModel');
const { uploadStudent } = require('../utils/multerConfig');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

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
    ).populate('student');

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Send email notification
    await sendStatusUpdateEmail(form);

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

// Add this function for sending status update emails
async function sendStatusUpdateEmail(form) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASSWORD
    },
  });

  const getFormTypeName = (formType) => {
    const formTypes = {
      form1: 'Admission Form',
      form2: 'Scholarship Form',
      form3: 'Leave Application',
      form4: 'Hostel Application',
      form5: 'Library Card Request',
      form6: 'ID Card Request',
      form7: 'Exam Registration',
      form8: 'Club Registration',
      form9: 'Certificate Request'
    };
    return formTypes[formType] || formType;
  };

  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: form.student.emailid,
    subject: `Form Status Update - ${getFormTypeName(form.formType)}`,
    html: `
      <h1>Hello ${form.student.studentName},</h1>
      <p>The status of your ${getFormTypeName(form.formType)} has been updated.</p>
      <p><strong>New Status:</strong> ${form.status.charAt(0).toUpperCase() + form.status.slice(1)}</p>
      <p><strong>Form Details:</strong></p>
      <ul>
        <li>Form Type: ${getFormTypeName(form.formType)}</li>
        <li>Submission Date: ${new Date(form.submittedAt).toLocaleDateString()}</li>
      </ul>
      ${form.status === 'approved' ? 
        '<p>Congratulations! Your form has been approved.</p>' : 
        form.status === 'rejected' ? 
        '<p>We regret to inform you that your form has been rejected. Please contact the administration for more details.</p>' :
        '<p>Your form is currently under review.</p>'
      }
      <p>If you have any questions, please contact our support team.</p>
      <p>Thank you!</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Status update email sent to ${form.student.emailid}`);
  } catch (error) {
    console.error('Error sending status update email:', error);
  }
}

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
