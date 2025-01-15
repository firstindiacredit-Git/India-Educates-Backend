const express = require("express");
const holiday = require("../jsonfile/2024holiday.json");
const sendEmail = require("../utils/emailService");
const Employee = require("../model/employeeModel");
const Holiday = require("../model/holiday");


const router = express.Router();

// Route to get holidays
router.get("/holidays", (req, res) => {
    res.json(holiday); // Return all holiday data
});

// Route to notify employees about the holiday and save the super admin's decision
router.post("/notifyHoliday", async (req, res) => {
    const { holidayName, holidayDate, isConfirmed } = req.body;
    const adminDecision = isConfirmed ? 'Yes' : 'No'; // Store decision as 'Yes' or 'No'

    try {
        // Update holiday confirmation status and admin decision in the database
        const holiday = await Holiday.findOne({ name: holidayName, date: holidayDate });
        if (holiday) {
            holiday.isConfirmed = isConfirmed;
            holiday.adminDecision = adminDecision; // Save super admin's decision
            await holiday.save();
        }

        // Fetch all employees' emails
        const employees = await Employee.find();
        const emailList = employees.map(emp => emp.emailid); // Collect email addresses

        if (isConfirmed) {
            const subject = `Tomorrow is a holiday: ${holidayName}`;
            const message = `Dear Team,\n\nThis is to inform you that tomorrow is a holiday due to ${holidayName} on ${holidayDate}. Enjoy your day off!\n\nBest regards,\nMD.Afzal`;

            // Loop through all emails and send one by one
            for (const email of emailList) {
                await sendEmail(subject, message, email); // Send email to each employee
            }

            return res.status(200).json({ message: "Holiday notification sent successfully to all employees!" });
        } else {
            const subject = "Reminder: No holiday tomorrow";
            const message = "Dear Team,\n\nPlease note that tomorrow is not a holiday. Kindly report to the office on time.\n\nBest regards,\nMD.Afzal";

            // Loop through all emails and send one by one
            for (const email of emailList) {
                await sendEmail(subject, message, email); // Send email to each employee
            }

            return res.status(200).json({ message: "Notification sent: No holiday tomorrow." });
        }
    } catch (error) {
        console.error("Error notifying employees:", error);
        res.status(500).json({ message: "Error sending holiday notification." });
    }
});



module.exports = router;
