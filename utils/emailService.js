const nodemailer = require("nodemailer");
const dotenv = require('dotenv');

dotenv.config();

const sendEmail = async (subject, message, recipients) => {
    const transporter = nodemailer.createTransport({
        service: "gmail", // Change to your email service
        auth: {
            user: process.env.USER_EMAIL,
            pass: process.env.USER_PASSWORD
        },
    });

    const mailOptions = {
        from: process.env.USER_EMAIL,
        to: recipients,
        subject: subject,
        text: message,
    };

    try {
        await transporter.sendMail(mailOptions);
        // console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email: ", error);
    }
};

module.exports = sendEmail;
