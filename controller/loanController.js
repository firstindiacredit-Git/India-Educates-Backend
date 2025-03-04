const express = require('express');
const router = express.Router();
const Student = require('../model/studentModel');

// Add a new loan for a student
router.post('/student/:studentId/loan', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const loanData = req.body;
        
        // Set remaining amount same as initial amount
        loanData.remainingAmount = loanData.amount;
        
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        student.loans.push(loanData);
        await student.save();
        
        res.status(201).json({ message: "Loan added successfully", loan: loanData });
    } catch (error) {
        res.status(500).json({ message: "Error adding loan", error: error.message });
    }
});

// Get all loans for a student
router.get('/student/:studentId/loans', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        res.status(200).json({ loans: student.loans });
    } catch (error) {
        res.status(500).json({ message: "Error fetching loans", error: error.message });
    }
});

// Add payment to a loan
router.post('/student/:studentId/loan/:loanId/payment', async (req, res) => {
    try {
        const { studentId, loanId } = req.params;
        const paymentData = req.body;
        
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        const loan = student.loans.id(loanId);
        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }
        
        // Add payment to history
        loan.paymentHistory.push(paymentData);
        
        // Update remaining amount
        loan.remainingAmount -= paymentData.amount;
        
        // Update loan status
        if (loan.remainingAmount <= 0) {
            loan.status = 'PAID';
        } else if (loan.remainingAmount < loan.amount) {
            loan.status = 'PARTIALLY_PAID';
        }
        
        await student.save();
        
        res.status(200).json({ message: "Payment added successfully", loan });
    } catch (error) {
        res.status(500).json({ message: "Error adding payment", error: error.message });
    }
});

// Update loan details
router.put('/student/:studentId/loan/:loanId', async (req, res) => {
    try {
        const { studentId, loanId } = req.params;
        const updateData = req.body;
        
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        const loan = student.loans.id(loanId);
        if (!loan) {
            return res.status(404).json({ message: "Loan not found" });
        }
        
        Object.assign(loan, updateData);
        await student.save();
        
        res.status(200).json({ message: "Loan updated successfully", loan });
    } catch (error) {
        res.status(500).json({ message: "Error updating loan", error: error.message });
    }
});

// Delete a loan
router.delete('/student/:studentId/loan/:loanId', async (req, res) => {
    try {
        const { studentId, loanId } = req.params;
        
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        student.loans.pull(loanId);
        await student.save();
        
        res.status(200).json({ message: "Loan deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting loan", error: error.message });
    }
});

// Get all loans from all students
router.get('/all-loans', async (req, res) => {
    try {
        // First get all students with their loans
        const students = await Student.find({}).lean();
        let allLoans = [];
        let serialNumber = 1;

        // Process each student's loans
        students.forEach(student => {
            if (student.loans && student.loans.length > 0) {
                student.loans.forEach(loan => {
                    allLoans.push({
                        ...loan,
                        serialNumber: serialNumber++,
                        studentName: student.studentName || 'N/A',  // Add student name
                        studentImage: student.studentImage || 'default.jpeg',
                        studentId: student._id,
                        date: loan.date ? new Date(loan.date).toLocaleDateString() : '-',
                        dueDate: loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '-'
                    });
                });
            }
        });

        // console.log('Processed loans:', allLoans); // For debugging
        res.status(200).json({ loans: allLoans });
    } catch (error) {
        console.error('Error in /all-loans:', error); // For debugging
        res.status(500).json({ message: "Error fetching loans", error: error.message });
    }
});

module.exports = router; 